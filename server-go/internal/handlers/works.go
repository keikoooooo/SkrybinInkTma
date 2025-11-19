package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/models"
)

// GetWorks handles GET /api/works
func (h *Handlers) GetWorks(c *gin.Context) {
	artistID := c.Query("artist_id")
	styleID := c.Query("style_id")

	query := `SELECT id, artist_id, style_id, image_url, caption, created_at FROM works WHERE 1=1`
	args := []interface{}{}
	argIndex := 1

	if artistID != "" {
		id, err := strconv.Atoi(artistID)
		if err == nil {
			query += " AND artist_id = $" + strconv.Itoa(argIndex)
			args = append(args, id)
			argIndex++
		}
	}

	if styleID != "" {
		id, err := strconv.Atoi(styleID)
		if err == nil {
			query += " AND style_id = $" + strconv.Itoa(argIndex)
			args = append(args, id)
			argIndex++
		}
	}

	query += " ORDER BY created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch works"})
		return
	}
	defer rows.Close()

	var works []models.Work
	for rows.Next() {
		var w models.Work
		var artistID sql.NullInt64
		var styleID sql.NullInt64
		var caption sql.NullString

		err := rows.Scan(&w.ID, &artistID, &styleID, &w.ImageURL, &caption, &w.CreatedAt)
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

		works = append(works, w)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "works": works})
}

// GetWork handles GET /api/works/:id
func (h *Handlers) GetWork(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid work ID"})
		return
	}

	var w models.Work
	var artistID sql.NullInt64
	var styleID sql.NullInt64
	var caption sql.NullString

	query := `SELECT id, artist_id, style_id, image_url, caption, created_at FROM works WHERE id = $1`
	err = h.db.QueryRow(query, id).Scan(&w.ID, &artistID, &styleID, &w.ImageURL, &caption, &w.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "work not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch work"})
		}
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

// GetArtists handles GET /api/artists
func (h *Handlers) GetArtists(c *gin.Context) {
	query := `SELECT id, display_name, bio, avatar_url, is_active, created_at, updated_at
	          FROM artists WHERE is_active = TRUE ORDER BY display_name`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch artists"})
		return
	}
	defer rows.Close()

	var artists []models.Artist
	for rows.Next() {
		var a models.Artist
		var bio sql.NullString
		var avatarURL sql.NullString

		err := rows.Scan(&a.ID, &a.DisplayName, &bio, &avatarURL, &a.IsActive, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			continue
		}

		if bio.Valid {
			a.Bio = &bio.String
		}
		if avatarURL.Valid {
			a.AvatarURL = &avatarURL.String
		}

		artists = append(artists, a)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "artists": artists})
}

// GetArtist handles GET /api/artists/:id
func (h *Handlers) GetArtist(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid artist ID"})
		return
	}

	var a models.Artist
	var bio sql.NullString
	var avatarURL sql.NullString

	query := `SELECT id, display_name, bio, avatar_url, is_active, created_at, updated_at
	          FROM artists WHERE id = $1`
	err = h.db.QueryRow(query, id).Scan(&a.ID, &a.DisplayName, &bio, &avatarURL, &a.IsActive, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "artist not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch artist"})
		}
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

// GetStyles handles GET /api/styles
func (h *Handlers) GetStyles(c *gin.Context) {
	query := `SELECT id, code, title, description, created_at FROM styles ORDER BY title`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to fetch styles"})
		return
	}
	defer rows.Close()

	var styles []models.Style
	for rows.Next() {
		var s models.Style
		var description sql.NullString

		err := rows.Scan(&s.ID, &s.Code, &s.Title, &description, &s.CreatedAt)
		if err != nil {
			continue
		}

		if description.Valid {
			s.Description = &description.String
		}

		styles = append(styles, s)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "styles": styles})
}

