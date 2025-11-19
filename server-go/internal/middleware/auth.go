package middleware

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// RequireAuth creates a middleware that checks if user is authenticated
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetHeader("X-User-ID")
		if userIDStr == "" {
			// Try to get from query or param
			userIDStr = c.Query("userId")
			if userIDStr == "" {
				userIDStr = c.Param("userId")
			}
		}

		if userIDStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
			c.Abort()
			return
		}

		userID, err := strconv.ParseInt(userIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

// RequireAdmin creates a middleware factory that requires admin role
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			userIDStr := c.GetHeader("X-User-ID")
			if userIDStr == "" {
				userIDStr = c.Query("userId")
			}
			if userIDStr == "" {
				userIDStr = c.Param("userId")
			}
			if userIDStr == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
				c.Abort()
				return
			}

			var err error
			userID, err = strconv.ParseInt(userIDStr, 10, 64)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid user ID"})
				c.Abort()
				return
			}
		}

		// Get database from context
		db, exists := c.Get("db")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "database not available"})
			c.Abort()
			return
		}

		var role string
		err := db.(*sql.DB).QueryRow("SELECT role FROM users WHERE id = $1", userID).Scan(&role)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "user not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "database error"})
			}
			c.Abort()
			return
		}

		if role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"ok": false, "error": "admin access required"})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

