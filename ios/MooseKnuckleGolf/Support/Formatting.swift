import Foundation

/// Mirrors src/lib/utils/date.ts's formatRoundDate/formatTeeTime, minus timezone
/// handling — round_date/tee_time are plain "YYYY-MM-DD"/"HH:mm:ss" strings with
/// no zone info, so parsing as UTC-naive local components is enough here.
enum DateFormatting {
    private static let isoDate: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()

    private static let displayDate: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d"
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()

    static func roundDate(_ raw: String) -> String {
        guard let date = isoDate.date(from: raw) else { return raw }
        return displayDate.string(from: date)
    }

    static func teeTime(_ raw: String) -> String {
        let parts = raw.split(separator: ":")
        guard parts.count >= 2, let hour = Int(parts[0]), let minute = Int(parts[1]) else { return raw }
        let period = hour < 12 ? "AM" : "PM"
        let displayHour = hour % 12 == 0 ? 12 : hour % 12
        return String(format: "%d:%02d %@", displayHour, minute, period)
    }
}
