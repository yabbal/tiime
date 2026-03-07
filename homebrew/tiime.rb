class Tiime < Formula
  desc "CLI & SDK for Tiime accounting - manage your French business accounting from the terminal"
  homepage "https://github.com/yabbal/tiime-cli"
  url "https://registry.npmjs.org/tiime-cli/-/tiime-cli-1.0.0.tgz"
  sha256 "PLACEHOLDER"
  license "MIT"

  depends_on "node@20"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/tiime version")
  end
end
