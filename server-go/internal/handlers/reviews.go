package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/models"
)

// GetReviews handles GET /api/reviews
func (h *Handlers) GetReviews(c *gin.Context) {
	artistID := c.Query("artist_id")
	workID := c.Query("work_id")
	publishedOnly := c.DefaultQuery("published", "true")

	query := `SELECT id, user_id, artist_id, work_id, rating, content, is_published, created_at
	          FROM reviews WHERE 1=1`
	args := []interface{}{}
	argIndex := 1

	if publishedOnly == "true" {
		query += " AND is_published = TRUE"
	}

	if artistID != "" {
		id, err := strconv.Atoi(artistID)
		if err == nil {
			query += " AND artist_id = $" + strconv.Itoa(argIndex)
			args = append(args, id)
			argIndex++
		}
	}

	if workID != "" {
		id, err := strconv.Atoi(workID)
		if err == nil {
			query += " AND work_id = $" + strconv.Itoa(argIndex)
			args = append(args, id)
			argIndex++
		}
	}

	query += " ORDER BY created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch reviews"})
		return
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var r models.Review
		var artistID sql.NullInt64
		var workID sql.NullInt64
		var content sql.NullString

		err := rows.Scan(&r.ID, &r.UserID, &artistID, &workID, &r.Rating, &content, &r.IsPublished, &r.CreatedAt)
		if err != nil {
			continue
		}

		if artistID.Valid {
			id := int(artistID.Int64)
			r.ArtistID = &id
		}
		if workID.Valid {
			id := int(workID.Int64)
			r.WorkID = &id
		}
		if content.Valid {
			r.Content = &content.String
		}

		reviews = append(reviews, r)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "reviews": reviews})
}

// GetReview handles GET /api/reviews/:id
func (h *Handlers) GetReview(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid review ID"})
		return
	}

	var r models.Review
	var artistID sql.NullInt64
	var workID sql.NullInt64
	var content sql.NullString

	query := `SELECT id, user_id, artist_id, work_id, rating, content, is_published, created_at
	          FROM reviews WHERE id = $1`
	err = h.db.QueryRow(query, id).Scan(&r.ID, &r.UserID, &artistID, &workID, &r.Rating, &content, &r.IsPublished, &r.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "review not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch review"})
		}
		return
	}

	if artistID.Valid {
		id := int(artistID.Int64)
		r.ArtistID = &id
	}
	if workID.Valid {
		id := int(workID.Int64)
		r.WorkID = &id
	}
	if content.Valid {
		r.Content = &content.String
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "review": r})
}

// CreateReview handles POST /api/reviews
func (h *Handlers) CreateReview(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Verify at least one of artist_id or work_id is provided
	if req.ArtistID == nil && req.WorkID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "artist_id or work_id is required"})
		return
	}

	var reviewID int
	query := `INSERT INTO reviews (user_id, artist_id, work_id, rating, content, is_published)
	          VALUES ($1, $2, $3, $4, $5, FALSE)
	          RETURNING id`
	err := h.db.QueryRow(query, userID, req.ArtistID, req.WorkID, req.Rating, req.Content).Scan(&reviewID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to create review"})
		return
	}

	// Fetch created review
	var r models.Review
	var artistID sql.NullInt64
	var workID sql.NullInt64
	var content sql.NullString

	fetchQuery := `SELECT id, user_id, artist_id, work_id, rating, content, is_published, created_at
	               FROM reviews WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, reviewID).Scan(&r.ID, &r.UserID, &artistID, &workID, &r.Rating, &content, &r.IsPublished, &r.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch created review"})
		return
	}

	if artistID.Valid {
		id := int(artistID.Int64)
		r.ArtistID = &id
	}
	if workID.Valid {
		id := int(workID.Int64)
		r.WorkID = &id
	}
	if content.Valid {
		r.Content = &content.String
	}

	c.JSON(http.StatusCreated, gin.H{"ok": true, "review": r})
}

// UpdateReview handles PUT /api/reviews/:id
func (h *Handlers) UpdateReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid review ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	// Verify ownership
	var ownerID int64
	err = h.db.QueryRow("SELECT user_id FROM reviews WHERE id = $1", reviewID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "review not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify ownership"})
		}
		return
	}

	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	var req struct {
		Rating  *int    `json:"rating"`
		Content *string `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Rating != nil {
		if *req.Rating < 1 || *req.Rating > 5 {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "rating must be between 1 and 5"})
			return
		}
		updates = append(updates, "rating = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Rating)
		argIndex++
	}

	if req.Content != nil {
		updates = append(updates, "content = $"+strconv.Itoa(argIndex))
		args = append(args, *req.Content)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "no fields to update"})
		return
	}

	args = append(args, reviewID)
	query := "UPDATE reviews SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += " WHERE id = $" + strconv.Itoa(argIndex)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to update review"})
		return
	}

	// Fetch updated review
	var r models.Review
	var artistID sql.NullInt64
	var workID sql.NullInt64
	var content sql.NullString

	fetchQuery := `SELECT id, user_id, artist_id, work_id, rating, content, is_published, created_at
	               FROM reviews WHERE id = $1`
	err = h.db.QueryRow(fetchQuery, reviewID).Scan(&r.ID, &r.UserID, &artistID, &workID, &r.Rating, &content, &r.IsPublished, &r.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch updated review"})
		return
	}

	if artistID.Valid {
		id := int(artistID.Int64)
		r.ArtistID = &id
	}
	if workID.Valid {
		id := int(workID.Int64)
		r.WorkID = &id
	}
	if content.Valid {
		r.Content = &content.String
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "review": r})
}

// DeleteReview handles DELETE /api/reviews/:id
func (h *Handlers) DeleteReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid review ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	// Verify ownership
	var ownerID int64
	err = h.db.QueryRow("SELECT user_id FROM reviews WHERE id = $1", reviewID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "review not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify ownership"})
		}
		return
	}

	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	_, err = h.db.Exec("DELETE FROM reviews WHERE id = $1", reviewID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to delete review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

