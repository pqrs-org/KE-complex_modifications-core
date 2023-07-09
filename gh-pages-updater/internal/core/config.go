package core

type config struct {
	// http server configurations
	Hostname string
	Port     int
	Secret   string

	// git configurations
	KEComplexModificationsRepositoryPath string
	GitHubPagesRepositoryPath            string
	SSHPrivateKeyPath                    string
}

var Config config
