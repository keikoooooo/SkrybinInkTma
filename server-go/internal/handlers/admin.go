package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/models"
)

// GetAdminRequests handles GET /api/admin/requests
func (h *Handlers) GetAdminRequests(c *gin.Context) {
	// Get orders with pending status that have comments (requests)
	query := `SELECT o.id, o.user_id, o.status, o.total_cents, o.comment, o.scheduled_at, o.created_at,
	          u.first_name, u.last_name, u.username
	          FROM orders o
	          JOIN users u ON o.user_id = u.id
	          WHERE o.status IN ('draft', 'pending') AND o.comment IS NOT NULL
	          ORDER BY o.created_at DESC`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch requests"})
		return
	}
	defer rows.Close()

	type Request struct {
		ID          int     `json:"id"`
		UserID      int64   `json:"user_id"`
		Status      string  `json:"status"`
		TotalCents  int     `json:"total_cents"`
		Comment     *string `json:"comment"`
		ScheduledAt *string `json:"scheduled_at"`
		CreatedAt   string  `json:"created_at"`
		UserName    *string `json:"user_name"`
		UserContact *string `json:"user_contact"`
	}

	var requests []Request
	for rows.Next() {
		var r Request
		var comment sql.NullString
		var scheduledAt sql.NullTime
		var firstName sql.NullString
		var lastName sql.NullString
		var username sql.NullString

		err := rows.Scan(&r.ID, &r.UserID, &r.Status, &r.TotalCents, &comment, &scheduledAt, &r.CreatedAt,
			&firstName, &lastName, &username)
		if err != nil {
			continue
		}

		if comment.Valid {
			r.Comment = &comment.String
		}
		if scheduledAt.Valid {
			dateStr := scheduledAt.Time.Format("02.01.06")
			r.ScheduledAt = &dateStr
		}

		// Build user name
		if firstName.Valid || lastName.Valid {
			name := ""
			if firstName.Valid {
				name = firstName.String
			}
			if lastName.Valid {
				if name != "" {
					name += " " + lastName.String
				} else {
					name = lastName.String
				}
			}
			r.UserName = &name
		}

		// Build contact
		if username.Valid {
			contact := "@" + username.String
			r.UserContact = &contact
		}

		requests = append(requests, r)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "requests": requests})
}

// GetAllOrders handles GET /api/admin/orders
func (h *Handlers) GetAllOrders(c *gin.Context) {
	status := c.Query("status")

	query := `SELECT o.id, o.user_id, o.status, o.total_cents, o.promo_code, o.comment, o.scheduled_at, o.created_at, o.updated_at
	          FROM orders o WHERE 1=1`
	args := []interface{}{}
	argIndex := 1

	if status != "" {
		query += " AND o.status = $" + strconv.Itoa(argIndex)
		args = append(args, status)
		argIndex++
	}

	query += " ORDER BY o.created_at DESC"

	rows, err := h.db.Query(query, args...)
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

		err := rows.Scan(&o.ID, &o.UserID, &o.Status, &o.TotalCents, &promoCode, &comment, &scheduledAt,
			&o.CreatedAt, &o.UpdatedAt)
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

		orders = append(orders, o)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "orders": orders})
}

// UpdateOrderStatus handles PUT /api/admin/orders/:id/status
func (h *Handlers) UpdateOrderStatus(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid order ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	validStatuses := map[string]bool{
		"draft": true, "pending": true, "paid": true, "scheduled": true, "cancelled": true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid status"})
		return
	}

	_, err = h.db.Exec("UPDATE orders SET status = $1, updated_at = now() WHERE id = $2", req.Status, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetAllUsers handles GET /api/admin/users
func (h *Handlers) GetAllUsers(c *gin.Context) {
	query := `SELECT id, username, first_name, last_name, language_code, photo_url, role,
	          balance_cents, bonus_points, personal_discount, created_at, updated_at
	          FROM users ORDER BY created_at DESC`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Username, &u.FirstName, &u.LastName, &u.LanguageCode, &u.PhotoURL,
			&u.Role, &u.BalanceCents, &u.BonusPoints, &u.PersonalDiscount, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			continue
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "users": users})
}

// UpdateUserRole handles PUT /api/admin/users/:id/role
func (h *Handlers) UpdateUserRole(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	validRoles := map[string]bool{"client": true, "admin": true}
	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid role"})
		return
	}

	_, err = h.db.Exec("UPDATE users SET role = $1, updated_at = now() WHERE id = $2", req.Role, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// CreateProduct handles POST /api/admin/products
func (h *Handlers) CreateProduct(c *gin.Context) {
	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var productID int
	query := `INSERT INTO products (style_id, title, description, price_cents, product_type, is_active)
	          VALUES ($1, $2, $3, $4, $5, $6)
	          RETURNING id`
	err := h.db.QueryRow(query, req.StyleID, req.Title, req.Description, req.PriceCents, req.ProductType, req.IsActive).Scan(&productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create product"})
		return
	}

	// Fetch created product
	var p models.Product
	var styleID sql.NullInt64
	var description sql.NullString

	fetchQuery := `SELECT id, style_id, title, description, price_cents, product_type, is_active, created_at, updated_at
	               FROM products WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, productID).Scan(&p.ID, &styleID, &p.Title, &description, &p.PriceCents,
		&p.ProductType, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch created product"})
		return
	}

	if styleID.Valid {
		id := int(styleID.Int64)
		p.StyleID = &id
	}
	if description.Valid {
		p.Description = &description.String
	}

	c.JSON(http.StatusCreated, gin.H{"ok": true, "product": p})
}

// UpdateProduct handles PUT /api/admin/products/:id
func (h *Handlers) UpdateProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid product ID"})
		return
	}

	var req struct {
		StyleID     *int    `json:"style_id"`
		Title       *string `json:"title"`
		Description *string `json:"description"`
		PriceCents  *int    `json:"price_cents"`
		ProductType *string `json:"product_type"`
		IsActive    *bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.StyleID != nil {
		updates = append(updates, "style_id = $"+strconv.Itoa(argIndex))
		args = append(args, *req.StyleID)
		argIndex++
	}
	if req.Title != nil {
		updates = append(updates, "title = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Title)
		argIndex++
	}
	if req.Description != nil {
		updates = append(updates, "description = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Description)
		argIndex++
	}
	if req.PriceCents != nil {
		updates = append(updates, "price_cents = $"+strconv.Itoa(argIndex))
		args = append(args, *req.PriceCents)
		argIndex++
	}
	if req.ProductType != nil {
		updates = append(updates, "product_type = $"+strconv.Itoa(argIndex))
		args = append(args, *req.ProductType)
		argIndex++
	}
	if req.IsActive != nil {
		updates = append(updates, "is_active = $"+strconv.Itoa(argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "no fields to update"})
		return
	}

	args = append(args, productID)
	query := "UPDATE products SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += ", updated_at = now() WHERE id = $" + strconv.Itoa(argIndex)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update product"})
		return
	}

	// Fetch updated product
	var p models.Product
	var styleID sql.NullInt64
	var description sql.NullString

	fetchQuery := `SELECT id, style_id, title, description, price_cents, product_type, is_active, created_at, updated_at
	               FROM products WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, productID).Scan(&p.ID, &styleID, &p.Title, &description, &p.PriceCents,
		&p.ProductType, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch updated product"})
		return
	}

	if styleID.Valid {
		id := int(styleID.Int64)
		p.StyleID = &id
	}
	if description.Valid {
		p.Description = &description.String
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "product": p})
}

// DeleteProduct handles DELETE /api/admin/products/:id
func (h *Handlers) DeleteProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid product ID"})
		return
	}

	// Soft delete by setting is_active to false
	_, err = h.db.Exec("UPDATE products SET is_active = FALSE, updated_at = now() WHERE id = $1", productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// CreateWork handles POST /api/admin/works
func (h *Handlers) CreateWork(c *gin.Context) {
	var req models.CreateWorkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var workID int
	query := `INSERT INTO works (artist_id, style_id, image_url, caption)
	          VALUES ($1, $2, $3, $4)
	          RETURNING id`
	err := h.db.QueryRow(query, req.ArtistID, req.StyleID, req.ImageURL, req.Caption).Scan(&workID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create work"})
		return
	}

	// Fetch created work
	var w models.Work
	var artistID sql.NullInt64
	var styleID sql.NullInt64
	var caption sql.NullString

	fetchQuery := `SELECT id, artist_id, style_id, image_url, caption, created_at FROM works WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, workID).Scan(&w.ID, &artistID, &styleID, &w.ImageURL, &caption, &w.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch created work"})
		return
	}

	if artistID.Valid {
		id := int(artistID.Int64)
		w.ArtistID = &id
	}
	if styleID.Valid {
		id := int(styleID.Int64)
		w.StyleID = &id
	}
	if caption.Valid {
		w.Caption = &caption.String
	}

	c.JSON(http.StatusCreated, gin.H{"ok": true, "work": w})
}

// UpdateWork handles PUT /api/admin/works/:id
func (h *Handlers) UpdateWork(c *gin.Context) {
	workID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid work ID"})
		return
	}

	var req struct {
		ArtistID *int    `json:"artist_id"`
		StyleID  *int    `json:"style_id"`
		ImageURL *string `json:"image_url"`
		Caption  *string `json:"caption"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.ArtistID != nil {
		updates = append(updates, "artist_id = $"+strconv.Itoa(argIndex))
		args = append(args, *req.ArtistID)
		argIndex++
	}
	if req.StyleID != nil {
		updates = append(updates, "style_id = $"+strconv.Itoa(argIndex))
		args = append(args, *req.StyleID)
		argIndex++
	}
	if req.ImageURL != nil {
		updates = append(updates, "image_url = $"+strconv.Itoa(argIndex))
		args = append(args, *req.ImageURL)
		argIndex++
	}
	if req.Caption != nil {
		updates = append(updates, "caption = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Caption)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "no fields to update"})
		return
	}

	args = append(args, workID)
	query := "UPDATE works SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += " WHERE id = $" + strconv.Itoa(argIndex)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update work"})
		return
	}

	// Fetch updated work
	var w models.Work
	var artistID sql.NullInt64
	var styleID sql.NullInt64
	var caption sql.NullString

	fetchQuery := `SELECT id, artist_id, style_id, image_url, caption, created_at FROM works WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, workID).Scan(&w.ID, &artistID, &styleID, &w.ImageURL, &caption, &w.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch updated work"})
		return
	}

	if artistID.Valid {
		id := int(artistID.Int64)
		w.ArtistID = &id
	}
	if styleID.Valid {
		id := int(styleID.Int64)
		w.StyleID = &id
	}
	if caption.Valid {
		w.Caption = &caption.String
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "work": w})
}

// DeleteWork handles DELETE /api/admin/works/:id
func (h *Handlers) DeleteWork(c *gin.Context) {
	workID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid work ID"})
		return
	}

	_, err = h.db.Exec("DELETE FROM works WHERE id = $1", workID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to delete work"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// CreateArtist handles POST /api/admin/artists
func (h *Handlers) CreateArtist(c *gin.Context) {
	var req models.CreateArtistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	var artistID int
	query := `INSERT INTO artists (display_name, bio, avatar_url, is_active)
	          VALUES ($1, $2, $3, $4)
	          RETURNING id`
	err := h.db.QueryRow(query, req.DisplayName, req.Bio, req.AvatarURL, req.IsActive).Scan(&artistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create artist"})
		return
	}

	// Fetch created artist
	var a models.Artist
	var bio sql.NullString
	var avatarURL sql.NullString

	fetchQuery := `SELECT id, display_name, bio, avatar_url, is_active, created_at, updated_at
	               FROM artists WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, artistID).Scan(&a.ID, &a.DisplayName, &bio, &avatarURL, &a.IsActive, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch created artist"})
		return
	}

	if bio.Valid {
		a.Bio = &bio.String
	}
	if avatarURL.Valid {
		a.AvatarURL = &avatarURL.String
	}

	c.JSON(http.StatusCreated, gin.H{"ok": true, "artist": a})
}

// UpdateArtist handles PUT /api/admin/artists/:id
func (h *Handlers) UpdateArtist(c *gin.Context) {
	artistID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid artist ID"})
		return
	}

	var req struct {
		DisplayName *string `json:"display_name"`
		Bio         *string `json:"bio"`
		AvatarURL   *string `json:"avatar_url"`
		IsActive    *bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.DisplayName != nil {
		updates = append(updates, "display_name = $"+strconv.Itoa(argIndex))
		args = append(args, *req.DisplayName)
		argIndex++
	}
	if req.Bio != nil {
		updates = append(updates, "bio = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Bio)
		argIndex++
	}
	if req.AvatarURL != nil {
		updates = append(updates, "avatar_url = $"+strconv.Itoa(argIndex))
		args = append(args, *req.AvatarURL)
		argIndex++
	}
	if req.IsActive != nil {
		updates = append(updates, "is_active = $"+strconv.Itoa(argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "no fields to update"})
		return
	}

	args = append(args, artistID)
	query := "UPDATE artists SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += ", updated_at = now() WHERE id = $" + strconv.Itoa(argIndex)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update artist"})
		return
	}

	// Fetch updated artist
	var a models.Artist
	var bio sql.NullString
	var avatarURL sql.NullString

	fetchQuery := `SELECT id, display_name, bio, avatar_url, is_active, created_at, updated_at
	               FROM artists WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, artistID).Scan(&a.ID, &a.DisplayName, &bio, &avatarURL, &a.IsActive, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch updated artist"})
		return
	}

	if bio.Valid {
		a.Bio = &bio.String
	}
	if avatarURL.Valid {
		a.AvatarURL = &avatarURL.String
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "artist": a})
}

// DeleteArtist handles DELETE /api/admin/artists/:id
func (h *Handlers) DeleteArtist(c *gin.Context) {
	artistID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid artist ID"})
		return
	}

	// Soft delete by setting is_active to false
	_, err = h.db.Exec("UPDATE artists SET is_active = FALSE, updated_at = now() WHERE id = $1", artistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to delete artist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

