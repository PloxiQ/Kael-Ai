import type { ClerkProviderProps } from "@clerk/react";
import type { Language } from "./translations";

type SignInLocalization = NonNullable<
  ClerkProviderProps["localization"]
>;

/**
 * Clerk renders its own copy. Keep the sign-in card in the same language as
 * the rest of the UI instead of falling back to English.
 */
export const CLERK_SIGN_IN_LOCALIZATION: Record<
  Language,
  SignInLocalization
> = {
    ru: {
      locale: "ru-RU",
      dividerText: "или",
      socialButtonsBlockButton: "Продолжить с {{provider|titleize}}",
      formFieldLabel__emailAddress_username: "Email или имя пользователя",
      formFieldInputPlaceholder__emailAddress_username:
        "Введите email или имя пользователя",
      formFieldLabel__password: "Пароль",
      formFieldInputPlaceholder__password: "Введите пароль",
      formButtonPrimary: "Продолжить",
      signIn: {
        start: {
          title: "Вход в KAEL",
          subtitle: "Войдите или создайте аккаунт, чтобы продолжить.",
          actionText: "Нет аккаунта?",
          actionLink: "Создать аккаунт",
        },
        password: {
          title: "Введите пароль",
          subtitle: "Для продолжения введите пароль от аккаунта.",
          actionLink: "Забыли пароль?",
        },
        emailCode: {
          title: "Проверьте почту",
          subtitle: "Мы отправили код подтверждения на вашу почту.",
          formTitle: "Введите код",
          resendButton: "Отправить код снова",
        },
        emailLink: {
          title: "Проверьте почту",
          subtitle: "Мы отправили ссылку для входа на вашу почту.",
          formTitle: "Откройте письмо",
          formSubtitle: "Нажмите на ссылку в письме, чтобы продолжить.",
          resendButton: "Отправить письмо снова",
        },
        forgotPassword: {
          title: "Сброс пароля",
          subtitle: "Мы отправим код для сброса пароля.",
          formTitle: "Введите код",
          resendButton: "Отправить код снова",
        },
        resetPassword: {
          title: "Новый пароль",
          formButtonPrimary: "Сохранить пароль",
          successMessage: "Пароль обновлён.",
        },
        alternativeMethods: {
          title: "Другие способы входа",
          subtitle: "Выберите способ входа в аккаунт.",
        },
      },
    },
    uk: {
      locale: "uk-UA",
      dividerText: "або",
      socialButtonsBlockButton: "Продовжити з {{provider|titleize}}",
      formFieldLabel__emailAddress_username: "Email або ім'я користувача",
      formFieldInputPlaceholder__emailAddress_username:
        "Введіть email або ім'я користувача",
      formFieldLabel__password: "Пароль",
      formFieldInputPlaceholder__password: "Введіть пароль",
      formButtonPrimary: "Продовжити",
      signIn: {
        start: {
          title: "Вхід у KAEL",
          subtitle: "Увійдіть або створіть акаунт, щоб продовжити.",
          actionText: "Немає акаунта?",
          actionLink: "Створити акаунт",
        },
        password: {
          title: "Введіть пароль",
          subtitle: "Щоб продовжити, введіть пароль від акаунта.",
          actionLink: "Забули пароль?",
        },
        emailCode: {
          title: "Перевірте пошту",
          subtitle: "Ми надіслали код підтвердження на вашу пошту.",
          formTitle: "Введіть код",
          resendButton: "Надіслати код ще раз",
        },
        emailLink: {
          title: "Перевірте пошту",
          subtitle: "Ми надіслали посилання для входу на вашу пошту.",
          formTitle: "Відкрийте лист",
          formSubtitle: "Натисніть на посилання в листі, щоб продовжити.",
          resendButton: "Надіслати лист ще раз",
        },
        forgotPassword: {
          title: "Скидання пароля",
          subtitle: "Ми надішлемо код для скидання пароля.",
          formTitle: "Введіть код",
          resendButton: "Надіслати код ще раз",
        },
        resetPassword: {
          title: "Новий пароль",
          formButtonPrimary: "Зберегти пароль",
          successMessage: "Пароль оновлено.",
        },
        alternativeMethods: {
          title: "Інші способи входу",
          subtitle: "Виберіть спосіб входу в акаунт.",
        },
      },
    },
    en: {
      locale: "en-US",
      dividerText: "or",
      socialButtonsBlockButton: "Continue with {{provider|titleize}}",
      formFieldLabel__emailAddress_username: "Email or username",
      formFieldInputPlaceholder__emailAddress_username:
        "Enter your email or username",
      formFieldLabel__password: "Password",
      formFieldInputPlaceholder__password: "Enter your password",
      formButtonPrimary: "Continue",
      signIn: {
        start: {
          title: "Sign in to KAEL",
          subtitle: "Sign in or create an account to continue.",
          actionText: "Don't have an account?",
          actionLink: "Sign up",
        },
        password: {
          title: "Enter your password",
          subtitle: "Enter the password for your account to continue.",
          actionLink: "Forgot password?",
        },
        emailCode: {
          title: "Check your email",
          subtitle: "We sent a verification code to your email.",
          formTitle: "Enter the code",
          resendButton: "Resend code",
        },
        emailLink: {
          title: "Check your email",
          subtitle: "We sent a sign-in link to your email.",
          formTitle: "Open the email",
          formSubtitle: "Follow the link in the email to continue.",
          resendButton: "Resend email",
        },
        forgotPassword: {
          title: "Reset your password",
          subtitle: "We will send a code to reset your password.",
          formTitle: "Enter the code",
          resendButton: "Resend code",
        },
        resetPassword: {
          title: "Set a new password",
          formButtonPrimary: "Save password",
          successMessage: "Password updated.",
        },
        alternativeMethods: {
          title: "Other sign-in methods",
          subtitle: "Choose how to sign in to your account.",
        },
      },
    },
  };
