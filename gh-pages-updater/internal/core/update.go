package core

import (
	"os"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
)

func UpdateGitHubPages() error {
	keRepo, err := getKEComplexModificationsRepository()
	if err != nil {
		return err
	}

	ghpRepo, err := getGitHubPagesRepository()
	if err != nil {
		return err
	}

	err = hardResetToMain(keRepo)
	if err != nil {
		return err
	}

	err = hardResetToMain(ghpRepo)
	if err != nil {
		return err
	}

	return nil
}

func getKEComplexModificationsRepository() (*git.Repository, error) {
	if _, err := os.Stat(Config.KEComplexModificationsRepositoryPath); os.IsNotExist(err) {
		repo, err := git.PlainClone(Config.KEComplexModificationsRepositoryPath, false, &git.CloneOptions{
			URL:      "https://github.com/pqrs-org/KE-complex_modifications.git",
			Progress: os.Stdout,
		})
		if err != nil {
			return nil, err
		}

		return repo, nil
	}

	repo, err := git.PlainOpen(Config.KEComplexModificationsRepositoryPath)
	if err != nil {
		return nil, err
	}

	err = repo.Fetch(&git.FetchOptions{})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return nil, err
	}

	return repo, nil
}

func getGitHubPagesRepository() (*git.Repository, error) {
	privateKey, err := os.ReadFile(Config.SSHPrivateKeyPath)
	if err != nil {
		return nil, err
	}

	publicKeys, err := ssh.NewPublicKeys("git", privateKey, "")
	if err != nil {
		return nil, err
	}

	if _, err := os.Stat(Config.GitHubPagesRepositoryPath); os.IsNotExist(err) {
		repo, err := git.PlainClone(Config.GitHubPagesRepositoryPath, false, &git.CloneOptions{
			Auth:     publicKeys,
			URL:      "git@github.com:pqrs-org/gh-pages-ke-complex-modifications.pqrs.org.git",
			Progress: os.Stdout,
		})
		if err != nil {
			return nil, err
		}

		return repo, nil
	}

	repo, err := git.PlainOpen(Config.KEComplexModificationsRepositoryPath)
	if err != nil {
		return nil, err
	}

	err = repo.Fetch(&git.FetchOptions{})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return nil, err
	}

	return repo, nil
}

func hardResetToMain(repo *git.Repository) error {
	mainReference, err := repo.Reference("refs/remotes/origin/main", true)
	if err != nil {
		return err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return err
	}

	worktree.Reset(&git.ResetOptions{
		Commit: mainReference.Hash(),
		Mode:   git.HardReset,
	})

	return nil
}
