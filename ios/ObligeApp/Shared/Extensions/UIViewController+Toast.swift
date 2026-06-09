import UIKit

extension UIViewController {
    func showToast(_ message: String, duration: TimeInterval = 2.0) {
        let toast = UILabel()
        toast.text = message
        toast.font = .systemFont(ofSize: 14)
        toast.textColor = .white
        toast.backgroundColor = UIColor.black.withAlphaComponent(0.75)
        toast.textAlignment = .center
        toast.numberOfLines = 0
        toast.layer.cornerRadius = 20
        toast.clipsToBounds = true
        toast.alpha = 0

        toast.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(toast)
        NSLayoutConstraint.activate([
            toast.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            toast.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -40),
            toast.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 32),
            toast.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -32),
            toast.heightAnchor.constraint(greaterThanOrEqualToConstant: 40),
        ])

        let padding: CGFloat = 16
        toast.layoutMargins = UIEdgeInsets(top: padding / 2, left: padding, bottom: padding / 2, right: padding)

        UIView.animate(withDuration: 0.3, animations: { toast.alpha = 1 }) { _ in
            UIView.animate(withDuration: 0.3, delay: duration, options: [], animations: {
                toast.alpha = 0
            }) { _ in toast.removeFromSuperview() }
        }
    }
}
