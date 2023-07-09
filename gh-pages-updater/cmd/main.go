package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/pqrs-org/KE-complex_modifications-core/gh-pages-updater/internal/core"

	"github.com/gin-gonic/gin"
)

func main() {
	err := core.ReadConfig()
	if err != nil {
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	err = core.UpdateGitHubPages()
	if err != nil {
		log.Fatal(err)
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"version": "1.0.0",
		})
	})

	r.GET("/update-gh-pages", func(c *gin.Context) {
		err := core.UpdateGitHubPages()
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.Status(http.StatusNoContent)
	})

	r.Run(fmt.Sprintf("%s:%d", core.Config.Hostname, core.Config.Port))
}
