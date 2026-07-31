import SwiftUI

struct SignInView: View {
    @EnvironmentObject private var authManager: AuthManager

    @State private var phoneNumber = ""
    @State private var otpCode = ""
    @State private var codeSent = false
    @State private var errorMessage: String?
    @State private var isBusy = false

    var body: some View {
        VStack(spacing: 24) {
            Image("Logo")
                .resizable()
                .scaledToFill()
                .frame(width: 96, height: 96)
                .clipShape(Circle())
                .overlay(Circle().stroke(Theme.holeCardBorder, lineWidth: 1.5))

            Text("Moose Knuckle Golf")
                .font(.anton(28))
                .foregroundStyle(.white)

            Button {
                signInWithGoogle()
            } label: {
                Label("Sign in with Google", systemImage: "g.circle.fill")
            }
            .buttonStyle(.theme(.primary))

            Divider().overlay(Theme.rowBorder)

            // Mirrors src/components/auth/phone-login-form.tsx's two-step flow:
            // send code -> enter code. Same 10-digit-US / 6-digit-code shape as the web validators.
            if codeSent {
                TextField("6-digit code", text: $otpCode)
                    .keyboardType(.numberPad)
                    .darkTextField()
                Button("Verify Code") {
                    verifyCode()
                }
                .buttonStyle(.theme(.secondary))
                .disabled(otpCode.count != 6 || isBusy)
            } else {
                TextField("10-digit phone number", text: $phoneNumber)
                    .keyboardType(.numberPad)
                    .darkTextField()
                Button("Send Code") {
                    sendCode()
                }
                .buttonStyle(.theme(.secondary))
                .disabled(phoneNumber.count != 10 || isBusy)
            }

            if let errorMessage {
                Text(errorMessage)
                    .foregroundStyle(Color(hex: 0xFF5C4D))
                    .font(.footnote)
            }
        }
        .padding(24)
        .cardBackground()
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background.ignoresSafeArea())
    }

    private func signInWithGoogle() {
        errorMessage = nil
        Task {
            isBusy = true
            defer { isBusy = false }
            do {
                try await authManager.signInWithGoogle()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func sendCode() {
        errorMessage = nil
        Task {
            isBusy = true
            defer { isBusy = false }
            do {
                try await authManager.sendPhoneCode(nationalNumber: phoneNumber)
                codeSent = true
            } catch {
                errorMessage = "Failed to send verification code. Please try again."
            }
        }
    }

    private func verifyCode() {
        errorMessage = nil
        Task {
            isBusy = true
            defer { isBusy = false }
            do {
                try await authManager.verifyPhoneCode(nationalNumber: phoneNumber, code: otpCode)
            } catch {
                errorMessage = "Invalid or expired code."
            }
        }
    }
}
