import UIKit

class SignUpViewController: UIViewController {

    private let nameField     = ObligeTextField(placeholder: "이름")
    private let emailField    = ObligeTextField(placeholder: "이메일", keyboardType: .emailAddress)
    private let passwordField = ObligeTextField(placeholder: "비밀번호", isSecure: true)
    private let confirmField  = ObligeTextField(placeholder: "비밀번호 확인", isSecure: true)

    private let errorLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13)
        l.textColor = .systemRed
        l.textAlignment = .center
        l.numberOfLines = 0
        return l
    }()

    private let signUpButton = ObligePrimaryButton(title: "가입하기")
    private let spinner = UIActivityIndicatorView(style: .medium)
    private let repo = AuthRepository()

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "회원가입"
        view.backgroundColor = .obligeWhite
        setupLayout()
        signUpButton.addTarget(self, action: #selector(signUpTapped), for: .touchUpInside)
        [nameField, emailField, passwordField, confirmField].forEach { $0.delegate = self }
    }

    private func setupLayout() {
        let stack = UIStackView(arrangedSubviews: [
            nameField, emailField, passwordField, confirmField,
            errorLabel, signUpButton
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

            stack.topAnchor.constraint(equalTo: scroll.topAnchor, constant: 32),
            stack.leadingAnchor.constraint(equalTo: scroll.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: scroll.trailingAnchor, constant: -24),
            stack.bottomAnchor.constraint(equalTo: scroll.bottomAnchor, constant: -40),
            stack.widthAnchor.constraint(equalTo: scroll.widthAnchor, constant: -48),

            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    @objc private func signUpTapped() {
        guard let name = nameField.text, !name.isEmpty,
              let email = emailField.text, !email.isEmpty,
              let pw = passwordField.text, !pw.isEmpty,
              let pw2 = confirmField.text else {
            errorLabel.text = "모든 항목을 입력해주세요."
            return
        }
        guard pw == pw2 else { errorLabel.text = "비밀번호가 일치하지 않습니다."; return }
        errorLabel.text = ""
        setLoading(true)
        Task {
            do {
                let profile = try await repo.signUp(email: email, password: pw, name: name)
                await MainActor.run { self.switchToMain(profile: profile) }
            } catch {
                await MainActor.run {
                    self.errorLabel.text = error.localizedDescription
                    self.setLoading(false)
                }
            }
        }
    }

    private func setLoading(_ on: Bool) {
        on ? spinner.startAnimating() : spinner.stopAnimating()
        signUpButton.isEnabled = !on
        signUpButton.alpha = on ? 0.6 : 1.0
    }

    private func switchToMain(profile: Profile) {
        AppRouter.switchToMain(profile: profile)
    }
}

extension SignUpViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        let fields = [nameField, emailField, passwordField, confirmField]
        if let i = fields.firstIndex(where: { $0 === textField }), i < fields.count - 1 {
            fields[i + 1].becomeFirstResponder()
        } else {
            textField.resignFirstResponder()
            signUpTapped()
        }
        return true
    }
}
