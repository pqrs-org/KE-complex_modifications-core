package main

import (
	"fmt"
	"net/http"

	"github.com/pqrs-org/KE-complex_modifications-core/gh-pages-updater/internal/core"

	"github.com/gin-gonic/gin"
)

func main() {
	err := core.ReadConfig()
	if err != nil {
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"version": "1.0.0",
		})
	})

	r.POST("/update-gh-pages", func(c *gin.Context) {
		var requestBody struct {
			Secret string
		}

		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(400, gin.H{"error": "invalid request body"})
			return
		}

		if requestBody.Secret != core.Config.Secret {
			c.JSON(401, gin.H{"error": "invalid secret"})
			return
		}

		err := core.UpdateGitHubPages()
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.Status(http.StatusNoContent)
	})

	r.Run(fmt.Sprintf("%s:%d", core.Config.Hostname, core.Config.Port))
}
