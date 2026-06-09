import UIKit

class LoginViewController: UIViewController {

    private let logoLabel: UILabel = {
        let l = UILabel()
        let att = NSMutableAttributedString(string: "OBLI", attributes: [
            .foregroundColor: UIColor.obligeNavy,
            .font: UIFont.systemFont(ofSize: 44, weight: .heavy)
        ])
        att.append(NSAttributedString(string: "GE", attributes: [
            .foregroundColor: UIColor.obligePink,
            .font: UIFont.systemFont(ofSize: 44, weight: .heavy)
        ]))
        l.attributedText = att
        l.textAlignment = .center
        return l
    }()

    private let taglineLabel: UILabel = {
        let l = UILabel()
        l.text = "Responsible Beauty"
        l.font = .systemFont(ofSize: 13)
        l.textColor = .secondaryLabel
        l.textAlignment = .center
        return l
    }()

    private let emailField = ObligeTextField(placeholder: "이메일", keyboardType: .emailAddress)
    private let passwordField = ObligeTextField(placeholder: "비밀번호", isSecure: true)

    private let errorLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13)
        l.textColor = .systemRed
        l.textAlignment = .center
        l.numberOfLines = 0
        return l
    }()

    private let loginButton = ObligePrimaryButton(title: "로그인")

    private let signUpButton: UIButton = {
        let b = UIButton(type: .system)
        b.setTitle("계정이 없으신가요? 회원가입", for: .normal)
        b.setTitleColor(.obligePink, for: .normal)
        b.titleLabel?.font = .systemFont(ofSize: 14)
        return b
    }()

    private let spinner = UIActivityIndicatorView(style: .medium)
    private let repo = AuthRepository()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .obligePaper
        navigationController?.setNavigationBarHidden(true, animated: false)
        setupLayout()
        loginButton.addTarget(self, action: #selector(loginTapped), for: .touchUpInside)
        signUpButton.addTarget(self, action: #selector(signUpTapped), for: .touchUpInside)
        emailField.delegate = self
        passwordField.delegate = self
    }

    private func setupLayout() {
        let stack = UIStackView(arrangedSubviews: [
            logoLabel, taglineLabel,
            spacer(height: 16),
            emailField, passwordField,
            errorLabel, loginButton, signUpButton
        ])
        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false

        let scroll = UIScrollView()
        scroll.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scroll)
        scroll.addSubview(stack)
        view.addSubview(spinner)
        spinner.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            stack.topAnchor.constraint(equalTo: scroll.topAnchor, constant: 60),
            stack.leadingAnchor.constraint(equalTo: scroll.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: scroll.trailingAnchor, constant: -24),
            stack.bottomAnchor.constraint(equalTo: scroll.bottomAnchor, constant: -40),
            stack.widthAnchor.constraint(equalTo: scroll.widthAnchor, constant: -48),

            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    @objc private func loginTapped() {
        guard let email = emailField.text, !email.isEmpty,
              let password = passwordField.text, !password.isEmpty else {
            errorLabel.text = "이메일과 비밀번호를 입력해주세요."
            return
        }
        errorLabel.text = ""
        setLoading(true)
        Task {
            do {
                let profile = try await repo.signIn(email: email, password: password)
                await MainActor.run { self.switchToMain(profile: profile) }
            } catch {
                await MainActor.run {
                    self.errorLabel.text = error.localizedDescription
                    self.setLoading(false)
                }
            }
        }
    }

    @objc private func signUpTapped() {
        navigationController?.pushViewController(SignUpViewController(), animated: true)
    }

    private func setLoading(_ on: Bool) {
        on ? spinner.startAnimating() : spinner.stopAnimating()
        loginButton.isEnabled = !on
        loginButton.alpha = on ? 0.6 : 1.0
    }

    private func switchToMain(profile: Profile) {
        AppRouter.switchToMain(profile: profile)
    }
}

extension LoginViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        if textField == emailField { passwordField.becomeFirstResponder() }
        else { textField.resignFirstResponder(); loginTapped() }
        return true
    }
}
