package core

import (
	"fmt"
	"os"
	"os/exec"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
)

func UpdateGitHubPages() error {
	//
	// Update repositories
	//

	keRepo, err := getKEComplexModificationsRepository()
	if err != nil {
		return err
	}

	ghpRepo, err := getGitHubPagesRepository()
	if err != nil {
		return err
	}

	keReference, err := hardResetToMain(keRepo)
	if err != nil {
		return err
	}

	_, err = hardResetToMain(ghpRepo)
	if err != nil {
		return err
	}

	//
	// Build files
	//

	cmd := exec.Command(
		"make",
		"-C",
		Config.KEComplexModificationsRepositoryPath,
		"update-public-build",
	)
	err = cmd.Run()
	if err != nil {
		return fmt.Errorf("failed to build /public/build/ files: %w", err)
	}

	//
	// Copy files
	//

	cmd = exec.Command(
		"rsync", "-La", "--delete",
		"--exclude", "CNAME",
		"--exclude", ".nojekyll",
		"--exclude", "build",
		"--exclude", "json",
		fmt.Sprintf("%s/core/react/dist/", Config.KEComplexModificationsRepositoryPath),
		fmt.Sprintf("%s/docs", Config.GitHubPagesRepositoryPath),
	)
	err = cmd.Run()
	if err != nil {
		return fmt.Errorf("failed to rsync docs: %w", err)
	}

	cmd = exec.Command(
		"rsync", "-La", "--delete",
		fmt.Sprintf("%s/public/build", Config.KEComplexModificationsRepositoryPath),
		fmt.Sprintf("%s/docs", Config.GitHubPagesRepositoryPath),
	)
	err = cmd.Run()
	if err != nil {
		return fmt.Errorf("failed to rsync docs/build: %w", err)
	}

	cmd = exec.Command(
		"rsync", "-La", "--delete",
		fmt.Sprintf("%s/public/json", Config.KEComplexModificationsRepositoryPath),
		fmt.Sprintf("%s/docs", Config.GitHubPagesRepositoryPath),
	)
	err = cmd.Run()
	if err != nil {
		return fmt.Errorf("failed to rsync docs/json: %w", err)
	}

	//
	// Commit
	//

	err = commit(ghpRepo, fmt.Sprintf("pqrs-org/KE-complex_modifications %s", keReference.Hash()))
	if err != nil && err != git.ErrEmptyCommit {
		return err
	}

	//
	// Push
	//

	err = pushGitHubPagesRepository(ghpRepo)
	if err != nil {
		return err
	}

	return nil
}

func getKEComplexModificationsRepository() (*git.Repository, error) {
	if _, err := os.Stat(Config.KEComplexModificationsRepositoryPath); os.IsNotExist(err) {
		repo, err := git.PlainClone(Config.KEComplexModificationsRepositoryPath, false, &git.CloneOptions{
			URL:               "https://github.com/pqrs-org/KE-complex_modifications.git",
			Progress:          os.Stdout,
			RecurseSubmodules: git.DefaultSubmoduleRecursionDepth,
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
	publicKeys, err := getSSHPublicKeys()
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

	repo, err := git.PlainOpen(Config.GitHubPagesRepositoryPath)
	if err != nil {
		return nil, err
	}

	err = repo.Fetch(&git.FetchOptions{
		Auth: publicKeys,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return nil, err
	}

	return repo, nil
}

func pushGitHubPagesRepository(repo *git.Repository) error {
	publicKeys, err := getSSHPublicKeys()
	if err != nil {
		return err
	}

	return repo.Push(&git.PushOptions{
		Auth: publicKeys,
	})
}

func getSSHPublicKeys() (*ssh.PublicKeys, error) {
	privateKey, err := os.ReadFile(Config.SSHPrivateKeyPath)
	if err != nil {
		return nil, err
	}

	return ssh.NewPublicKeys("git", privateKey, "")
}

func hardResetToMain(repo *git.Repository) (*plumbing.Reference, error) {
	//
	// Reset repository
	//

	mainReference, err := repo.Reference("refs/remotes/origin/main", false)
	if err != nil {
		return nil, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	err = worktree.Reset(&git.ResetOptions{
		Commit: mainReference.Hash(),
		Mode:   git.HardReset,
	})
	if err != nil {
		return nil, err
	}

	//
	// Reset submodules
	//

	submodules, err := worktree.Submodules()
	if err != nil {
		return nil, err
	}

	for _, sub := range submodules {
		err = sub.Update(&git.SubmoduleUpdateOptions{})
		if err != nil {
			return nil, err
		}
	}

	return mainReference, nil
}

func commit(repo *git.Repository, message string) error {
	worktree, err := repo.Worktree()
	if err != nil {
		return err
	}

	err = worktree.AddWithOptions(&git.AddOptions{
		All: true,
	})
	if err != nil {
		return err
	}

	//
	// AllowEmptyCommits does not work properly, so new commit is added even if there are no changes.
	// So we should check worktree status by hand.
	//

	status, err := worktree.Status()
	if err != nil {
		return err
	}

	if status.IsClean() {
		return git.ErrEmptyCommit
	}

	_, err = worktree.Commit(message, &git.CommitOptions{
		Author: &object.Signature{
			Name:  "gh-pages-updater",
			Email: "tekezo@pqrs.org",
			When:  time.Now(),
		},
	})
	if err != nil {
		return err
	}

	return nil
}
