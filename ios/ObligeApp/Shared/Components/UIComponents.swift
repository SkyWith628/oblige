import UIKit

// MARK: - Design tokens

enum ODS {
    // Corner radius
    static let radiusCard: CGFloat = 4
    static let radiusPill: CGFloat = 999
    static let radiusInput: CGFloat = 6

    // Shadow (brutalist: no blur, just offset)
    static func applyHardShadow(_ view: UIView, color: UIColor = .obligeInk, offset: CGSize = CGSize(width: 5, height: 5)) {
        view.layer.shadowColor   = color.cgColor
        view.layer.shadowOpacity = 1
        view.layer.shadowRadius  = 0
        view.layer.shadowOffset  = offset
        view.layer.masksToBounds = false
    }

    static func applyBorder(_ view: UIView, color: UIColor = .obligeInk, width: CGFloat = 1) {
        view.layer.borderColor = color.cgColor
        view.layer.borderWidth = width
    }
}

// MARK: - ObligePrimaryButton
// ink 배경 + 라임 박스 섀도우

final class ObligePrimaryButton: UIButton {
    init(title: String) {
        super.init(frame: .zero)
        setTitle(title, for: .normal)
        titleLabel?.font = .systemFont(ofSize: 16, weight: .bold)
        backgroundColor = .obligeInk
        setTitleColor(.obligeWhite, for: .normal)
        layer.cornerRadius = ODS.radiusCard
        ODS.applyBorder(self, color: .obligeInk)
        ODS.applyHardShadow(self, color: .obligePink, offset: CGSize(width: 6, height: 6))
        heightAnchor.constraint(equalToConstant: 54).isActive = true
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - ObligeSecondaryButton
// 라임 배경 + ink 텍스트 + ink 섀도우

final class ObligeSecondaryButton: UIButton {
    init(title: String) {
        super.init(frame: .zero)
        setTitle(title, for: .normal)
        titleLabel?.font = .systemFont(ofSize: 14, weight: .bold)
        backgroundColor = .obligeLime
        setTitleColor(.obligeInk, for: .normal)
        layer.cornerRadius = ODS.radiusPill
        ODS.applyBorder(self, color: .obligeInk)
        ODS.applyHardShadow(self, color: .obligeInk, offset: CGSize(width: 3, height: 3))
        heightAnchor.constraint(equalToConstant: 36).isActive = true
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - ObligeChip
// pill 모양 레이블 칩

final class ObligeChip: UIView {
    private let label = UILabel()

    init(text: String, background: UIColor = .obligeLime) {
        super.init(frame: .zero)
        backgroundColor = background
        layer.cornerRadius = ODS.radiusPill
        ODS.applyBorder(self, color: .obligeInk)
        label.text = text
        label.font = .systemFont(ofSize: 11, weight: .bold)
        label.textColor = .obligeInk
        label.translatesAutoresizingMaskIntoConstraints = false
        addSubview(label)
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            label.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -6),
            label.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12),
            label.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -12),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - ObligeCard
// ink 테두리 + hard shadow 카드

final class ObligeCard: UIView {
    init(background: UIColor = .obligeWhite, shadowColor: UIColor = .obligeInk) {
        super.init(frame: .zero)
        backgroundColor = background
        layer.cornerRadius = ODS.radiusCard
        ODS.applyBorder(self, color: .obligeInk)
        ODS.applyHardShadow(self, color: shadowColor, offset: CGSize(width: 5, height: 5))
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - ObligeTextField

final class ObligeTextField: UITextField {
    init(placeholder: String, keyboardType: UIKeyboardType = .default, isSecure: Bool = false) {
        super.init(frame: .zero)
        self.placeholder       = placeholder
        self.keyboardType      = keyboardType
        self.isSecureTextEntry = isSecure
        self.autocorrectionType    = .no
        self.autocapitalizationType = .none
        self.borderStyle = .none
        self.font        = .systemFont(ofSize: 16)
        self.backgroundColor = .obligeWhite
        layer.cornerRadius = ODS.radiusInput
        ODS.applyBorder(self, color: .obligeInk)
        heightAnchor.constraint(equalToConstant: 52).isActive = true
        // left padding
        leftView = UIView(frame: CGRect(x: 0, y: 0, width: 14, height: 0))
        leftViewMode = .always
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - spacer helper

func spacer(height: CGFloat) -> UIView {
    let v = UIView()
    v.heightAnchor.constraint(equalToConstant: height).isActive = true
    return v
}

// MARK: - UIView then helper

extension UIView {
    @discardableResult func then(_ block: (Self) -> Void) -> Self { block(self); return self }
}
