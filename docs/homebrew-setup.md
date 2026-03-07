# Distribution Homebrew

## Setup du tap

Pour distribuer via Homebrew, créer un repo `yabbal/homebrew-tap` sur GitHub :

```bash
# Créer le repo
gh repo create yabbal/homebrew-tap --public --description "Homebrew formulae"

# Cloner et ajouter la formule
git clone https://github.com/yabbal/homebrew-tap.git
mkdir -p homebrew-tap/Formula
cp homebrew/tiime.rb homebrew-tap/Formula/tiime.rb
cd homebrew-tap
git add . && git commit -m "feat: add tiime formula" && git push
```

## Mise à jour automatique

Le workflow de release met à jour automatiquement la formule Homebrew
après chaque publication npm. Il faut :

1. Créer un Personal Access Token (PAT) GitHub avec scope `repo`
2. L'ajouter comme secret `HOMEBREW_TAP_TOKEN` dans le repo `yabbal/tiime`

## Installation pour les utilisateurs

```bash
brew tap yabbal/tap
brew install tiime
```

## Mise à jour

```bash
brew upgrade tiime
```
