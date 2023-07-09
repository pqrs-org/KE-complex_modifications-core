package core

import "github.com/spf13/viper"

func ReadConfig() error {
	viper.SetConfigType("toml")
	viper.AddConfigPath(".")
	err := viper.ReadInConfig()
	if err != nil {
		return err
	}

	viper.Unmarshal(&Config)

	return nil
}
