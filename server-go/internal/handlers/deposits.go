package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/models"
)

// GetDeposits handles GET /api/deposits/:userId
func (h *Handlers) GetDeposits(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	query := `SELECT id, user_id, amount_cents, certificate_code, expires_at, created_at
	          FROM deposits
	          WHERE user_id = $1
	          ORDER BY created_at DESC`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch deposits"})
		return
	}
	defer rows.Close()

	var deposits []models.Deposit
	for rows.Next() {
		var d models.Deposit
		var certificateCode sql.NullString
		var expiresAt sql.NullTime

		err := rows.Scan(&d.ID, &d.UserID, &d.AmountCents, &certificateCode, &expiresAt, &d.CreatedAt)
		if err != nil {
			continue
		}

		if certificateCode.Valid {
			d.CertificateCode = &certificateCode.String
		}
		if expiresAt.Valid {
			d.ExpiresAt = &expiresAt.Time
		}

		deposits = append(deposits, d)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "deposits": deposits})
}

// CreateDeposit handles POST /api/deposits
func (h *Handlers) CreateDeposit(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	var req models.CreateDepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Create deposit
	var depositID int
	query := `INSERT INTO deposits (user_id, amount_cents, certificate_code, expires_at)
	          VALUES ($1, $2, $3, $4)
	          RETURNING id`
	err = tx.QueryRow(query, userID, req.AmountCents, req.CertificateCode, req.ExpiresAt).Scan(&depositID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create deposit"})
		return
	}

	// Update user balance
	_, err = tx.Exec("UPDATE users SET balance_cents = balance_cents + $1 WHERE id = $2", req.AmountCents, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update balance"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to commit transaction"})
		return
	}

	// Fetch created deposit
	var d models.Deposit
	var certificateCode sql.NullString
	var expiresAt sql.NullTime

	fetchQuery := `SELECT id, user_id, amount_cents, certificate_code, expires_at, created_at
	               FROM deposits WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, depositID).Scan(&d.ID, &d.UserID, &d.AmountCents, &certificateCode, &expiresAt, &d.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch created deposit"})
		return
	}

	if certificateCode.Valid {
		d.CertificateCode = &certificateCode.String
	}
	if expiresAt.Valid {
		d.ExpiresAt = &expiresAt.Time
	}

	c.JSON(http.StatusCreated, gin.H{"ok": true, "deposit": d})
}

// GetAppointments handles GET /api/appointments/:userId
func (h *Handlers) GetAppointments(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	query := `SELECT a.id, a.order_id, a.artist_id, a.scheduled_at, a.status, a.comment
	          FROM appointments a
	          JOIN orders o ON a.order_id = o.id
	          WHERE o.user_id = $1
	          ORDER BY a.scheduled_at DESC`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch appointments"})
		return
	}
	defer rows.Close()

	var appointments []models.Appointment
	for rows.Next() {
		var a models.Appointment
		var artistID sql.NullInt64
		var scheduledAt sql.NullTime
		var comment sql.NullString

		err := rows.Scan(&a.ID, &a.OrderID, &artistID, &scheduledAt, &a.Status, &comment)
		if err != nil {
			continue
		}

		if artistID.Valid {
			id := int(artistID.Int64)
			a.ArtistID = &id
		}
		if scheduledAt.Valid {
			a.ScheduledAt = &scheduledAt.Time
		}
		if comment.Valid {
			a.Comment = &comment.String
		}

		appointments = append(appointments, a)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "appointments": appointments})
}

// CreateAppointment handles POST /api/appointments
func (h *Handlers) CreateAppointment(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	var req models.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Verify order ownership
	var orderUserID int64
	err := h.db.QueryRow("SELECT user_id FROM orders WHERE id = $1", req.OrderID).Scan(&orderUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify order"})
		}
		return
	}

	if orderUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	var appointmentID int
	query := `INSERT INTO appointments (order_id, artist_id, scheduled_at, status, comment)
	          VALUES ($1, $2, $3, 'pending', $4)
	          RETURNING id`
	err = h.db.QueryRow(query, req.OrderID, req.ArtistID, req.ScheduledAt, req.Comment).Scan(&appointmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create appointment"})
		return
	}

	// Fetch created appointment
	var a models.Appointment
	var artistID sql.NullInt64
	var scheduledAt sql.NullTime
	var comment sql.NullString

	fetchQuery := `SELECT id, order_id, artist_id, scheduled_at, status, comment
	               FROM appointments WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, appointmentID).Scan(&a.ID, &a.OrderID, &artistID, &scheduledAt, &a.Status, &comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch created appointment"})
		return
	}

	if artistID.Valid {
		id := int(artistID.Int64)
		a.ArtistID = &id
	}
	if scheduledAt.Valid {
		a.ScheduledAt = &scheduledAt.Time
	}
	if comment.Valid {
		a.Comment = &comment.String
	}

	c.JSON(http.StatusCreated, gin.H{"ok": true, "appointment": a})
}

// UpdateAppointment handles PUT /api/appointments/:id
func (h *Handlers) UpdateAppointment(c *gin.Context) {
	appointmentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid appointment ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	// Verify order ownership
	var orderUserID int64
	err = h.db.QueryRow(`SELECT o.user_id FROM appointments a
	                     JOIN orders o ON a.order_id = o.id
	                     WHERE a.id = $1`, appointmentID).Scan(&orderUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "appointment not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify ownership"})
		}
		return
	}

	if orderUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	var req struct {
		ArtistID    *int       `json:"artist_id"`
		ScheduledAt *time.Time `json:"scheduled_at"`
		Status      *string    `json:"status"`
		Comment     *string    `json:"comment"`
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
	if req.ScheduledAt != nil {
		updates = append(updates, "scheduled_at = $"+strconv.Itoa(argIndex))
		args = append(args, *req.ScheduledAt)
		argIndex++
	}
	if req.Status != nil {
		updates = append(updates, "status = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Status)
		argIndex++
	}
	if req.Comment != nil {
		updates = append(updates, "comment = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Comment)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "no fields to update"})
		return
	}

	args = append(args, appointmentID)
	query := "UPDATE appointments SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += " WHERE id = $" + strconv.Itoa(argIndex)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update appointment"})
		return
	}

	// Fetch updated appointment
	var a models.Appointment
	var artistID sql.NullInt64
	var scheduledAt sql.NullTime
	var comment sql.NullString

	fetchQuery := `SELECT id, order_id, artist_id, scheduled_at, status, comment
	               FROM appointments WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, appointmentID).Scan(&a.ID, &a.OrderID, &artistID, &scheduledAt, &a.Status, &comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch updated appointment"})
		return
	}

	if artistID.Valid {
		id := int(artistID.Int64)
		a.ArtistID = &id
	}
	if scheduledAt.Valid {
		a.ScheduledAt = &scheduledAt.Time
	}
	if comment.Valid {
		a.Comment = &comment.String
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "appointment": a})
}

