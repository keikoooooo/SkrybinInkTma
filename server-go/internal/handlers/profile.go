package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/models"
)

// GetProfile handles GET /api/profile/:userId
func (h *Handlers) GetProfile(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	var user models.User
	query := `SELECT id, username, first_name, last_name, language_code, photo_url, role, 
	          balance_cents, bonus_points, personal_discount, created_at, updated_at
	          FROM users WHERE id = $1`
	err = h.db.QueryRow(query, userID).Scan(
		&user.ID, &user.Username, &user.FirstName, &user.LastName, &user.LanguageCode,
		&user.PhotoURL, &user.Role, &user.BalanceCents, &user.BonusPoints,
		&user.PersonalDiscount, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "user not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch profile"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "user": user})
}

// UpdateProfile handles PUT /api/profile/:userId
func (h *Handlers) UpdateProfile(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	// Verify user can only update their own profile (unless admin)
	requestUserID, exists := c.Get("userID")
	if !exists || requestUserID.(int64) != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	var req struct {
		Username         *string `json:"username"`
		FirstName        *string `json:"first_name"`
		LastName         *string `json:"last_name"`
		LanguageCode     *string `json:"language_code"`
		PhotoURL         *string `json:"photo_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Build update query
	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Username != nil {
		updates = append(updates, "username = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Username)
		argIndex++
	}
	if req.FirstName != nil {
		updates = append(updates, "first_name = $"+strconv.Itoa(argIndex))
		args = append(args, *req.FirstName)
		argIndex++
	}
	if req.LastName != nil {
		updates = append(updates, "last_name = $"+strconv.Itoa(argIndex))
		args = append(args, *req.LastName)
		argIndex++
	}
	if req.LanguageCode != nil {
		updates = append(updates, "language_code = $"+strconv.Itoa(argIndex))
		args = append(args, *req.LanguageCode)
		argIndex++
	}
	if req.PhotoURL != nil {
		updates = append(updates, "photo_url = $"+strconv.Itoa(argIndex))
		args = append(args, *req.PhotoURL)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "no fields to update"})
		return
	}

	args = append(args, userID)
	query := "UPDATE users SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += ", updated_at = now() WHERE id = $" + strconv.Itoa(argIndex)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update profile"})
		return
	}

	// Fetch updated user
	var user models.User
	fetchQuery := `SELECT id, username, first_name, last_name, language_code, photo_url, role, 
	               balance_cents, bonus_points, personal_discount, created_at, updated_at
	               FROM users WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, userID).Scan(
		&user.ID, &user.Username, &user.FirstName, &user.LastName, &user.LanguageCode,
		&user.PhotoURL, &user.Role, &user.BalanceCents, &user.BonusPoints,
		&user.PersonalDiscount, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch updated profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "user": user})
}

