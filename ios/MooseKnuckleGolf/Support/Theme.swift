import SwiftUI

/// Ports src/components/scores/hole-by-hole-scorecard.tsx and site-header.tsx —
/// the app's real dark UI. (colors.ts/tailwind.config.ts are dead code, never
/// imported by the actual product; the whole web app forces colorScheme: 'dark'
/// unconditionally in layout.tsx.)
enum Theme {
    static let background = Color(hex: 0x000000)
    static let rowBackground = Color(hex: 0x161816)
    static let rowBorder = Color.white.opacity(0.06)
    static let holeCardBackground = Color(hex: 0x0F1A0F)
    static let holeCardBorder = Color(hex: 0x00C853).opacity(0.25)
    static let accent = Color(hex: 0x00C853)
    static let diceAmberBg = Color(hex: 0xd97706).opacity(0.1)
    static let diceAmber = Color(hex: 0xd97706)
    static let diceAmberBright = Color(hex: 0xfbbf24)

    /// Ports AVATAR_COLORS (hole-by-hole-scorecard.tsx) — assigned by foursome order.
    static let avatarColors: [Color] = [
        Color(hex: 0x7E57C2), Color(hex: 0x42A5F5), Color(hex: 0x26A69A), Color(hex: 0xFFA726),
        Color(hex: 0xEF5350), Color(hex: 0x66BB6A), Color(hex: 0xEC407A), Color(hex: 0x78909C),
    ]

    /// Ports scoreMeta() (hole-by-hole-scorecard.tsx:52-61).
    static func scoreMeta(score: Int?, par: Int) -> (label: String, color: Color) {
        guard let score else { return ("TAP TO LOG", Color.white.opacity(0.35)) }
        let d = score - par
        if d <= -2 { return ("EAGLE", Color(hex: 0xFFD24A)) }
        if d == -1 { return ("BIRDIE", Color(hex: 0x5BC0EB)) }
        if d == 0 { return ("PAR", accent) }
        if d == 1 { return ("BOGEY", Color.white.opacity(0.55)) }
        if d == 2 { return ("+2", Color(hex: 0xFF7A6B)) }
        return ("+\(d)", Color(hex: 0xFF5C4D))
    }

    static func applyNavigationBarAppearance() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundColor = UIColor(hex: 0x18181B).withAlphaComponent(0.85)
        appearance.backgroundEffect = UIBlurEffect(style: .systemChromeMaterialDark)
        appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]

        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().tintColor = UIColor(hex: 0x00C853)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

extension Font {
    /// Ports FONT_ANTON — the huge display font for hole numbers / score values.
    static func anton(_ size: CGFloat) -> Font {
        .custom("Anton-Regular", size: size)
    }

    /// Ports FONT_MONO — small uppercase labels (RD #, HCP, PAR, DICE ROLLS...).
    static func jbMono(_ size: CGFloat) -> Font {
        .custom("JetBrainsMono-Regular", size: size)
    }

    static func barlow(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .bold: name = "Barlow-Bold"
        case .semibold: name = "Barlow-SemiBold"
        case .heavy, .black: name = "Barlow-ExtraBold"
        default: name = "Barlow-Regular"
        }
        return .custom(name, size: size)
    }
}

/// Flat dark row style used everywhere on web — depth comes only from a subtle
/// border, never a shadow.
struct CardBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(12)
            .background(Theme.rowBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Theme.rowBorder, lineWidth: 1)
            )
    }
}

extension View {
    func cardBackground() -> some View {
        modifier(CardBackground())
    }

    /// Dark-on-black replacement for the default `.roundedBorder` text field style,
    /// which renders a light box that doesn't fit this UI.
    func darkTextField() -> some View {
        self
            .textFieldStyle(.plain)
            .foregroundStyle(.white)
            .padding(12)
            .background(Theme.rowBackground)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Theme.rowBorder, lineWidth: 1)
            )
    }
}

/// Ports the admin/status pill pattern from site-header.tsx:136-143.
struct PillBadge: View {
    var text: String
    var body: some View {
        Text(text)
            .font(.barlow(12, weight: .semibold))
            .foregroundStyle(Color(hex: 0x4ade80))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color(hex: 0x1B4D2E).opacity(0.85))
            .clipShape(Capsule())
            .overlay(
                Capsule().stroke(Color(hex: 0x4ade80).opacity(0.25), lineWidth: 1)
            )
    }
}

/// Button styling matching the web's flat, borderless dark buttons.
enum ThemeButtonVariant {
    case primary, secondary, success, danger, ghost

    var fill: Color? {
        switch self {
        case .primary: return Theme.accent
        case .secondary: return Color(hex: 0x2B8A8A)
        case .success: return Theme.accent
        case .danger: return Color(hex: 0xFF5C4D)
        case .ghost: return nil
        }
    }

    var foreground: Color {
        switch self {
        case .primary, .success: return .black
        case .ghost: return .white
        default: return .white
        }
    }
}

extension ThemeButtonVariant: Equatable {}

struct ThemeButtonStyle: ButtonStyle {
    var variant: ThemeButtonVariant = .primary

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.barlow(16, weight: .semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(variant.fill ?? Color.clear)
            .foregroundStyle(variant.foreground)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(variant == .ghost ? Color.white.opacity(0.12) : .clear, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

extension ButtonStyle where Self == ThemeButtonStyle {
    static func theme(_ variant: ThemeButtonVariant = .primary) -> ThemeButtonStyle {
        ThemeButtonStyle(variant: variant)
    }
}
