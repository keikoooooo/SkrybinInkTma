package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"skryabin-ink-server/internal/database"
	"skryabin-ink-server/internal/handlers"
	"skryabin-ink-server/internal/middleware"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize handlers
	h := handlers.New(db)

	// Setup router
	r := gin.Default()

	// Add database to context
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	// CORS configuration
	config := cors.DefaultConfig()
	allowedOrigins := os.Getenv("CORS_ORIGIN")
	if allowedOrigins != "" {
		config.AllowOrigins = []string{allowedOrigins}
	} else {
		config.AllowAllOrigins = true
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-User-ID"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Static file serving for uploaded images
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	r.Static("/uploads", uploadDir)

	// API routes
	api := r.Group("/api")
	{
		// Session
		api.POST("/session", h.CreateSession)

		// Catalog
		api.GET("/catalog", h.GetCatalog)

		// Products
		api.GET("/products", h.GetProducts)
		api.GET("/products/:id", h.GetProduct)

		// Orders
		api.GET("/orders/:userId", middleware.RequireAuth(), h.GetUserOrders)
		api.POST("/orders", middleware.RequireAuth(), h.CreateOrder)
		api.GET("/orders/:userId/:orderId", middleware.RequireAuth(), h.GetOrder)
		api.PUT("/orders/:id", middleware.RequireAuth(), h.UpdateOrder)
		api.DELETE("/orders/:id", middleware.RequireAuth(), h.CancelOrder)

		// Profile
		api.GET("/profile/:userId", middleware.RequireAuth(), h.GetProfile)
		api.PUT("/profile/:userId", middleware.RequireAuth(), h.UpdateProfile)

		// Works
		api.GET("/works", h.GetWorks)
		api.GET("/works/:id", h.GetWork)

		// Artists
		api.GET("/artists", h.GetArtists)
		api.GET("/artists/:id", h.GetArtist)

		// Styles
		api.GET("/styles", h.GetStyles)

		// Favorites
		api.GET("/favorites/:userId", middleware.RequireAuth(), h.GetFavorites)
		api.POST("/favorites", middleware.RequireAuth(), h.AddFavorite)
		api.DELETE("/favorites/:id", middleware.RequireAuth(), h.RemoveFavorite)

		// Reviews
		api.GET("/reviews", h.GetReviews)
		api.GET("/reviews/:id", h.GetReview)
		api.POST("/reviews", middleware.RequireAuth(), h.CreateReview)
		api.PUT("/reviews/:id", middleware.RequireAuth(), h.UpdateReview)
		api.DELETE("/reviews/:id", middleware.RequireAuth(), h.DeleteReview)

		// Deposits
		api.GET("/deposits/:userId", middleware.RequireAuth(), h.GetDeposits)
		api.POST("/deposits", middleware.RequireAuth(), h.CreateDeposit)

		// Appointments
		api.GET("/appointments/:userId", middleware.RequireAuth(), h.GetAppointments)
		api.POST("/appointments", middleware.RequireAuth(), h.CreateAppointment)
		api.PUT("/appointments/:id", middleware.RequireAuth(), h.UpdateAppointment)

		// Upload
		api.POST("/upload/image", middleware.RequireAuth(), h.UploadImage)

		// Admin routes
		admin := api.Group("/admin", middleware.RequireAdmin())
		{
			admin.GET("/requests", h.GetAdminRequests)
			admin.GET("/orders", h.GetAllOrders)
			admin.PUT("/orders/:id/status", h.UpdateOrderStatus)
			admin.GET("/users", h.GetAllUsers)
			admin.PUT("/users/:id/role", h.UpdateUserRole)
			admin.POST("/products", h.CreateProduct)
			admin.PUT("/products/:id", h.UpdateProduct)
			admin.DELETE("/products/:id", h.DeleteProduct)
			admin.POST("/works", h.CreateWork)
			admin.PUT("/works/:id", h.UpdateWork)
			admin.DELETE("/works/:id", h.DeleteWork)
			admin.POST("/artists", h.CreateArtist)
			admin.PUT("/artists/:id", h.UpdateArtist)
			admin.DELETE("/artists/:id", h.DeleteArtist)
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

