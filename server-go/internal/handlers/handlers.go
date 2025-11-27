package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/models"
	"skryabin-ink-server/internal/utils"
)

type Handlers struct {
	db       *sql.DB
	adminIDs map[int64]bool
}

func New(db *sql.DB) *Handlers {
	h := &Handlers{
		db:       db,
		adminIDs: make(map[int64]bool),
	}

	// Parse admin IDs from environment
	adminIDsStr := os.Getenv("ADMIN_IDS")
	if adminIDsStr != "" {
		for _, idStr := range strings.Split(adminIDsStr, ",") {
			idStr = strings.TrimSpace(idStr)
			if id, err := strconv.ParseInt(idStr, 10, 64); err == nil {
				h.adminIDs[id] = true
			}
		}
	}

	return h
}

// IsAdmin checks if a user ID is in the admin list
func (h *Handlers) IsAdmin(userID int64) bool {
	return h.adminIDs[userID]
}

// CreateSession handles POST /api/session
func (h *Handlers) CreateSession(c *gin.Context) {
	var req models.CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	params, err := utils.ValidateTelegramInitData(req.InitData)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "invalid init data"})
		return
	}

	userRaw, ok := params["user"]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "initData has no user"})
		return
	}

	var user models.User
	if err := json.Unmarshal([]byte(userRaw), &user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user data"})
		return
	}

	// Determine role based on admin IDs from environment
	role := "client"
	if h.IsAdmin(user.ID) {
		role = "admin"
	}

	// Upsert user with role assignment
	// If user is in ADMIN_IDS, always set role to admin
	// Otherwise, keep existing role or default to 'client' for new users
	query := `INSERT INTO users (id, username, first_name, last_name, language_code, photo_url, role)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)
	          ON CONFLICT (id) DO UPDATE
	          SET username = EXCLUDED.username,
	              first_name = EXCLUDED.first_name,
	              last_name = EXCLUDED.last_name,
	              language_code = EXCLUDED.language_code,
	              photo_url = EXCLUDED.photo_url,
	              role = CASE WHEN $7 = 'admin' THEN 'admin' ELSE users.role END,
	              updated_at = now()
	          RETURNING id, username, first_name, last_name, language_code, photo_url, role, balance_cents, bonus_points, personal_discount`

	var updatedUser models.User
	err = h.db.QueryRow(query,
		user.ID, user.Username, user.FirstName, user.LastName, user.LanguageCode, user.PhotoURL, role,
	).Scan(
		&updatedUser.ID, &updatedUser.Username, &updatedUser.FirstName, &updatedUser.LastName,
		&updatedUser.LanguageCode, &updatedUser.PhotoURL, &updatedUser.Role,
		&updatedUser.BalanceCents, &updatedUser.BonusPoints, &updatedUser.PersonalDiscount,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to save user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "user": updatedUser})
}

// GetCatalog handles GET /api/catalog
func (h *Handlers) GetCatalog(c *gin.Context) {
	query := `SELECT p.id, p.title, p.description, p.price_cents, p.product_type, s.title AS style
	          FROM products p
	          LEFT JOIN styles s ON p.style_id = s.id
	          WHERE p.is_active = TRUE
	          ORDER BY p.id`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"ok":    false,
			"error": "failed to fetch catalog",
			"details": err.Error(),
		})
		return
	}
	defer rows.Close()

	var items []map[string]interface{}
	for rows.Next() {
		var id int
		var title string
		var description sql.NullString
		var priceCents int
		var productType string
		var style sql.NullString

		if err := rows.Scan(&id, &title, &description, &priceCents, &productType, &style); err != nil {
			continue
		}

		item := map[string]interface{}{
			"id":           id,
			"title":        title,
			"price_cents":  priceCents,
			"product_type": productType,
		}

		if description.Valid {
			item["description"] = description.String
		} else {
			item["description"] = nil
		}

		if style.Valid {
			item["style"] = style.String
		} else {
			item["style"] = nil
		}

		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "items": items})
}

// GetProducts handles GET /api/products
func (h *Handlers) GetProducts(c *gin.Context) {
	query := `SELECT p.id, p.style_id, p.title, p.description, p.price_cents, p.product_type, p.is_active, p.created_at, p.updated_at,
	          s.id, s.code, s.title, s.description, s.created_at
	          FROM products p
	          LEFT JOIN styles s ON p.style_id = s.id
	          WHERE p.is_active = TRUE
	          ORDER BY p.id`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch products"})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		var styleID sql.NullInt64
		var description sql.NullString
		var sID sql.NullInt64
		var sCode sql.NullString
		var sTitle sql.NullString
		var sDescription sql.NullString
		var sCreatedAt sql.NullTime

		err := rows.Scan(
			&p.ID, &styleID, &p.Title, &description, &p.PriceCents, &p.ProductType, &p.IsActive,
			&p.CreatedAt, &p.UpdatedAt,
			&sID, &sCode, &sTitle, &sDescription, &sCreatedAt,
		)
		if err != nil {
			continue
		}

		if styleID.Valid {
			id := int(styleID.Int64)
			p.StyleID = &id
		}

		if description.Valid {
			p.Description = &description.String
		}

		if sID.Valid {
			style := &models.Style{
				ID:        int(sID.Int64),
				Code:      sCode.String,
				Title:     sTitle.String,
				CreatedAt: sCreatedAt.Time,
			}
			if sDescription.Valid {
				style.Description = &sDescription.String
			}
			p.Style = style
		}

		products = append(products, p)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "products": products})
}

// GetProduct handles GET /api/products/:id
func (h *Handlers) GetProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid product ID"})
		return
	}

	var p models.Product
	var styleID sql.NullInt64
	var description sql.NullString
	var sID sql.NullInt64
	var sCode sql.NullString
	var sTitle sql.NullString
	var sDescription sql.NullString
	var sCreatedAt sql.NullTime

	query := `SELECT p.id, p.style_id, p.title, p.description, p.price_cents, p.product_type, p.is_active, p.created_at, p.updated_at,
	          s.id, s.code, s.title, s.description, s.created_at
	          FROM products p
	          LEFT JOIN styles s ON p.style_id = s.id
	          WHERE p.id = $1`

	err = h.db.QueryRow(query, id).Scan(
		&p.ID, &styleID, &p.Title, &description, &p.PriceCents, &p.ProductType, &p.IsActive,
		&p.CreatedAt, &p.UpdatedAt,
		&sID, &sCode, &sTitle, &sDescription, &sCreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "product not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch product"})
		}
		return
	}

	if styleID.Valid {
		id := int(styleID.Int64)
		p.StyleID = &id
	}

	if description.Valid {
		p.Description = &description.String
	}

	if sID.Valid {
		style := &models.Style{
			ID:        int(sID.Int64),
			Code:      sCode.String,
			Title:     sTitle.String,
			CreatedAt: sCreatedAt.Time,
		}
		if sDescription.Valid {
			style.Description = &sDescription.String
		}
		p.Style = style
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "product": p})
}

// GetUserOrders handles GET /api/orders/:userId
func (h *Handlers) GetUserOrders(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	query := `SELECT o.id, o.user_id, o.status, o.total_cents, o.promo_code, o.comment, o.scheduled_at, o.created_at, o.updated_at
	          FROM orders o
	          WHERE o.user_id = $1
	          ORDER BY o.created_at DESC`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch orders"})
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		var promoCode sql.NullString
		var comment sql.NullString
		var scheduledAt sql.NullTime

		err := rows.Scan(
			&o.ID, &o.UserID, &o.Status, &o.TotalCents, &promoCode, &comment, &scheduledAt,
			&o.CreatedAt, &o.UpdatedAt,
		)
		if err != nil {
			continue
		}

		if promoCode.Valid {
			o.PromoCode = &promoCode.String
		}
		if comment.Valid {
			o.Comment = &comment.String
		}
		if scheduledAt.Valid {
			o.ScheduledAt = &scheduledAt.Time
		}

		// Fetch order items
		itemsQuery := `SELECT id, order_id, product_id, quantity, price_cents, body_zone, notes
		               FROM order_items
		               WHERE order_id = $1`
		itemRows, err := h.db.Query(itemsQuery, o.ID)
		if err == nil {
			for itemRows.Next() {
				var item models.OrderItem
				var productID sql.NullInt64
				var bodyZone sql.NullString
				var notes sql.NullString

				if err := itemRows.Scan(&item.ID, &item.OrderID, &productID, &item.Quantity, &item.PriceCents, &bodyZone, &notes); err != nil {
					continue
				}

				if productID.Valid {
					id := int(productID.Int64)
					item.ProductID = &id
				}
				if bodyZone.Valid {
					item.BodyZone = &bodyZone.String
				}
				if notes.Valid {
					item.Notes = &notes.String
				}

				o.Items = append(o.Items, item)
			}
			itemRows.Close()
		}

		orders = append(orders, o)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "orders": orders})
}

// CreateOrder handles POST /api/orders
func (h *Handlers) CreateOrder(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Calculate total
	totalCents := 0
	for _, item := range req.Items {
		var priceCents int
		err := h.db.QueryRow("SELECT price_cents FROM products WHERE id = $1 AND is_active = TRUE", item.ProductID).Scan(&priceCents)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": fmt.Sprintf("product %d not found", item.ProductID)})
			return
		}
		totalCents += priceCents * item.Quantity
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Create order
	var orderID int
	orderQuery := `INSERT INTO orders (user_id, status, total_cents, promo_code, comment)
	               VALUES ($1, 'draft', $2, $3, $4)
	               RETURNING id`
	err = tx.QueryRow(orderQuery, userID, totalCents, req.PromoCode, req.Comment).Scan(&orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create order"})
		return
	}

	// Create order items
	for _, item := range req.Items {
		var priceCents int
		err := tx.QueryRow("SELECT price_cents FROM products WHERE id = $1", item.ProductID).Scan(&priceCents)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": fmt.Sprintf("product %d not found", item.ProductID)})
			return
		}

		_, err = tx.Exec(
			`INSERT INTO order_items (order_id, product_id, quantity, price_cents, body_zone, notes)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			orderID, item.ProductID, item.Quantity, priceCents, item.BodyZone, item.Notes,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create order item"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to commit transaction"})
		return
	}

	// Fetch created order
	var order models.Order
	var promoCode sql.NullString
	var comment sql.NullString

	query := `SELECT id, user_id, status, total_cents, promo_code, comment, scheduled_at, created_at, updated_at
	          FROM orders WHERE id = $1`
	err = h.db.QueryRow(query, orderID).Scan(
		&order.ID, &order.UserID, &order.Status, &order.TotalCents, &promoCode, &comment,
		&order.ScheduledAt, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch created order"})
		return
	}

	if promoCode.Valid {
		order.PromoCode = &promoCode.String
	}
	if comment.Valid {
		order.Comment = &comment.String
	}

	// Fetch items
	itemsQuery := `SELECT id, order_id, product_id, quantity, price_cents, body_zone, notes
	               FROM order_items WHERE order_id = $1`
	itemRows, err := h.db.Query(itemsQuery, orderID)
	if err == nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var item models.OrderItem
			var productID sql.NullInt64
			var bodyZone sql.NullString
			var notes sql.NullString

			if err := itemRows.Scan(&item.ID, &item.OrderID, &productID, &item.Quantity, &item.PriceCents, &bodyZone, &notes); err != nil {
				continue
			}

			if productID.Valid {
				id := int(productID.Int64)
				item.ProductID = &id
			}
			if bodyZone.Valid {
				item.BodyZone = &bodyZone.String
			}
			if notes.Valid {
				item.Notes = &notes.String
			}

			order.Items = append(order.Items, item)
		}
	}

	c.JSON(http.StatusCreated, gin.H{"ok": true, "order": order})
}

// GetOrder handles GET /api/orders/:userId/:orderId
func (h *Handlers) GetOrder(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	orderID, err := strconv.Atoi(c.Param("orderId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid order ID"})
		return
	}

	var order models.Order
	var promoCode sql.NullString
	var comment sql.NullString
	var scheduledAt sql.NullTime

	query := `SELECT id, user_id, status, total_cents, promo_code, comment, scheduled_at, created_at, updated_at
	          FROM orders WHERE id = $1 AND user_id = $2`
	err = h.db.QueryRow(query, orderID, userID).Scan(
		&order.ID, &order.UserID, &order.Status, &order.TotalCents, &promoCode, &comment,
		&scheduledAt, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch order"})
		}
		return
	}

	if promoCode.Valid {
		order.PromoCode = &promoCode.String
	}
	if comment.Valid {
		order.Comment = &comment.String
	}
	if scheduledAt.Valid {
		order.ScheduledAt = &scheduledAt.Time
	}

	// Fetch items
	itemsQuery := `SELECT id, order_id, product_id, quantity, price_cents, body_zone, notes
	               FROM order_items WHERE order_id = $1`
	itemRows, err := h.db.Query(itemsQuery, orderID)
	if err == nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var item models.OrderItem
			var productID sql.NullInt64
			var bodyZone sql.NullString
			var notes sql.NullString

			if err := itemRows.Scan(&item.ID, &item.OrderID, &productID, &item.Quantity, &item.PriceCents, &bodyZone, &notes); err != nil {
				continue
			}

			if productID.Valid {
				id := int(productID.Int64)
				item.ProductID = &id
			}
			if bodyZone.Valid {
				item.BodyZone = &bodyZone.String
			}
			if notes.Valid {
				item.Notes = &notes.String
			}

			order.Items = append(order.Items, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "order": order})
}

// UpdateOrder handles PUT /api/orders/:id
func (h *Handlers) UpdateOrder(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid order ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	// Verify ownership
	var ownerID int64
	err = h.db.QueryRow("SELECT user_id FROM orders WHERE id = $1", orderID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify ownership"})
		}
		return
	}

	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	var req models.UpdateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Build update query
	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.Comment != nil {
		updates = append(updates, fmt.Sprintf("comment = $%d", argIndex))
		args = append(args, *req.Comment)
		argIndex++
	}

	if req.ScheduledAt != nil {
		updates = append(updates, fmt.Sprintf("scheduled_at = $%d", argIndex))
		args = append(args, *req.ScheduledAt)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "no fields to update"})
		return
	}

	args = append(args, orderID)
	query := fmt.Sprintf("UPDATE orders SET %s, updated_at = now() WHERE id = $%d",
		strings.Join(updates, ", "), argIndex)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update order"})
		return
	}

	// Fetch updated order
	var order models.Order
	var promoCode sql.NullString
	var comment sql.NullString
	var scheduledAt sql.NullTime

	fetchQuery := `SELECT id, user_id, status, total_cents, promo_code, comment, scheduled_at, created_at, updated_at
	               FROM orders WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, orderID).Scan(
		&order.ID, &order.UserID, &order.Status, &order.TotalCents, &promoCode, &comment,
		&scheduledAt, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch updated order"})
		return
	}

	if promoCode.Valid {
		order.PromoCode = &promoCode.String
	}
	if comment.Valid {
		order.Comment = &comment.String
	}
	if scheduledAt.Valid {
		order.ScheduledAt = &scheduledAt.Time
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "order": order})
}

// CancelOrder handles DELETE /api/orders/:id
func (h *Handlers) CancelOrder(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid order ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	// Verify ownership
	var ownerID int64
	err = h.db.QueryRow("SELECT user_id FROM orders WHERE id = $1", orderID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify ownership"})
		}
		return
	}

	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	_, err = h.db.Exec("UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1", orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to cancel order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

