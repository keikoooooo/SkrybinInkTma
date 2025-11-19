package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/models"
)

// GetFavorites handles GET /api/favorites/:userId
func (h *Handlers) GetFavorites(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
		return
	}

	query := `SELECT f.id, f.user_id, f.work_id, f.created_at,
	          w.id, w.artist_id, w.style_id, w.image_url, w.caption, w.created_at
	          FROM favorites f
	          JOIN works w ON f.work_id = w.id
	          WHERE f.user_id = $1
	          ORDER BY f.created_at DESC`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch favorites"})
		return
	}
	defer rows.Close()

	var favorites []models.Favorite
	for rows.Next() {
		var f models.Favorite
		var w models.Work
		var artistID sql.NullInt64
		var styleID sql.NullInt64
		var caption sql.NullString

		err := rows.Scan(
			&f.ID, &f.UserID, &f.WorkID, &f.CreatedAt,
			&w.ID, &artistID, &styleID, &w.ImageURL, &caption, &w.CreatedAt,
		)
		if err != nil {
			continue
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

		f.Work = &w
		favorites = append(favorites, f)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "favorites": favorites})
}

// AddFavorite handles POST /api/favorites
func (h *Handlers) AddFavorite(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	var req models.AddFavoriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Verify work exists
	var workID int
	err := h.db.QueryRow("SELECT id FROM works WHERE id = $1", req.WorkID).Scan(&workID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "work not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify work"})
		}
		return
	}

	// Insert favorite (ignore if already exists)
	var favoriteID int
	query := `INSERT INTO favorites (user_id, work_id)
	          VALUES ($1, $2)
	          ON CONFLICT (user_id, work_id) DO NOTHING
	          RETURNING id`
	err = h.db.QueryRow(query, userID, req.WorkID).Scan(&favoriteID)
	if err != nil {
		if err == sql.ErrNoRows {
			// Already exists, fetch it
			err = h.db.QueryRow("SELECT id FROM favorites WHERE user_id = $1 AND work_id = $2", userID, req.WorkID).Scan(&favoriteID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to add favorite"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to add favorite"})
			return
		}
	}

	var f models.Favorite
	var w models.Work
	var artistID sql.NullInt64
	var styleID sql.NullInt64
	var caption sql.NullString

	fetchQuery := `SELECT f.id, f.user_id, f.work_id, f.created_at,
	               w.id, w.artist_id, w.style_id, w.image_url, w.caption, w.created_at
	               FROM favorites f
	               JOIN works w ON f.work_id = w.id
	               WHERE f.id = $1`
	err = h.db.QueryRow(fetchQuery, favoriteID).Scan(
		&f.ID, &f.UserID, &f.WorkID, &f.CreatedAt,
		&w.ID, &artistID, &styleID, &w.ImageURL, &caption, &w.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch favorite"})
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

	f.Work = &w

	c.JSON(http.StatusCreated, gin.H{"ok": true, "favorite": f})
}

// RemoveFavorite handles DELETE /api/favorites/:id
func (h *Handlers) RemoveFavorite(c *gin.Context) {
	favoriteID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid favorite ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	// Verify ownership
	var ownerID int64
	err = h.db.QueryRow("SELECT user_id FROM favorites WHERE id = $1", favoriteID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "favorite not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to verify ownership"})
		}
		return
	}

	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "access denied"})
		return
	}

	_, err = h.db.Exec("DELETE FROM favorites WHERE id = $1", favoriteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to remove favorite"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

