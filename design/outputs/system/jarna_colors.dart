// Jarna colour tokens for the customer app (co.jarna.customer), v1.0.0 — 2026-10-20.
//
// Source of truth: design/outputs/system/jarna-tokens.json
// Precedence: Fadl direction > Color-Policy-v1 > Color-Only-Scope > handoff v4 > v65 screenshots.
//
// SCOPE: colour only. Do not change fonts, sizes, paddings, radii, shapes,
// navigation or icons when applying this file. `JarnaTheme.applyColors` only
// touches colour fields of an existing ThemeData, and leaves everything else
// as the app has it today.
//
// Status tags in comments:
//   [A] approved  — Policy v1 or the 33 component rules
//   [I] inherited — hex named in a directive (component rules / CLAUDE.md), catalogued in Tokens.json
//   [P] prior reference — only in prior work outputs; provisional until Fadl decides (CONFLICTS C12)
//   [D] derived   — computed by design, pending Fadl approval (see design/outputs/CONFLICTS.md)
//
// Requires Flutter >= 3.22 (WidgetStateProperty, surfaceContainer* roles).
// NOT COMPILED: no Flutter toolchain or app repository was available when this was written.

import 'package:flutter/material.dart';

/// Raw Jarna colours, each bound to one role. Use roles, never hex values in widgets.
abstract final class JarnaColors {
  // ---------------------------------------------------------------- surfaces
  /// [A] Page background on every screen. No cream, gradient or texture.
  static const Color background = Color(0xFFFFFFFF);

  /// [A] Cards, sheets, search field, inner-page headers.
  static const Color surface = Color(0xFFFFFFFF);

  /// [A] Bottom tab bar and fixed bottom areas.
  static const Color footer = Color(0xFFFFFFFF);

  /// [A] Mint: free-delivery panel, empty-state support, existing space behind category images.
  static const Color supportivePanel = Color(0xFFE0F1EC);

  // ---------------------------------------------------------------- identity (petrol)
  /// [A] Home header fill only. Inner pages keep a white header.
  static const Color brandHeader = Color(0xFF006B63);

  /// [A] Text and icons on the home header.
  static const Color onBrandHeader = Color(0xFFFFFFFF);

  /// [A] Title and back icon on white inner-page headers.
  static const Color innerHeaderTitle = Color(0xFF172D2B);

  /// [A] Oval floating basket pill body. Shape, size, image, count and position unchanged.
  static const Color floatingBasket = Color(0xFF006B63);

  /// [I] Basket pill while pressed.
  static const Color floatingBasketPressed = Color(0xFF004F49);

  /// [A] Item count text on the basket pill (6.40:1).
  static const Color onFloatingBasket = Color(0xFFFFFFFF);

  /// [A] Secondary text actions: "تغيير", "إضافة المزيد من المقاضي", account links.
  static const Color link = Color(0xFF006B63);

  /// [I] Pressed link / petrol icon.
  static const Color linkPressed = Color(0xFF004F49);

  /// [A] Search magnifier, secondary-action icons.
  /// Not the + and − of the current quantity stepper: use [onQuantityStepper].
  static const Color iconAction = Color(0xFF006B63);

  /// [D] Fill of the existing solid quantity stepper pill (v65 shape kept).
  /// Provisional until Fadl decides AUD-C9 (design/outputs/CONFLICTS.md).
  static const Color quantityStepper = Color(0xFF006B63);

  /// [D] + and − symbols and the count on [quantityStepper] (6.40:1). Provisional (AUD-C9).
  static const Color onQuantityStepper = Color(0xFFFFFFFF);

  /// [A] Active bottom tab icon and label (keep the existing weight/indicator cue).
  static const Color tabActive = Color(0xFF006B63);

  /// [I] Inactive bottom tab icon and label.
  static const Color tabInactive = Color(0xFF5A6D68);

  /// [A] Free-delivery text, and the completed bar once eligibility is real.
  static const Color confirmedFreeDelivery = Color(0xFF006B63);

  /// [A] Completed and current timeline steps.
  static const Color timelineDone = Color(0xFF006B63);

  /// [I] Upcoming timeline steps.
  static const Color timelineUpcoming = Color(0xFF5A6D68);

  // ---------------------------------------------------------------- selection
  /// [A] Selected-category underline, check marks, selected-address border.
  static const Color selectionIndicator = Color(0xFF006B63);

  /// [A] Mint fill of a selected address/option. Never the only selection cue (1.17:1 vs white).
  static const Color selectionSurface = Color(0xFFE0F1EC);

  /// [A] Label of a selected category/address stays ink (CONFLICTS C5).
  static const Color selectionLabel = Color(0xFF172D2B);

  /// [A] Input border on focus.
  static const Color focusBorder = Color(0xFF006B63);

  // ---------------------------------------------------------------- direction (coral)
  /// [A] "إضافة", "اختر طريقة الدفع", "إتمام الطلب". One filled primary per decision area.
  static const Color primaryAction = Color(0xFFFF745E);

  /// [D] Pressed coral = 8% ink state layer. Ink label stays at 4.80:1 (CONFLICTS C9).
  static const Color primaryActionPressed = Color(0xFFEC6E5A);

  /// [A] Label/icon on coral. NEVER white (white on coral is 2.65:1).
  static const Color onPrimaryAction = Color(0xFF172D2B);

  /// [A] Arrow circle inside the basket pill.
  static const Color basketArrowSurface = Color(0xFFFF745E);

  /// [A] Arrow glyph inside the coral circle (ink, not white; CONFLICTS C10).
  static const Color basketArrowIcon = Color(0xFF172D2B);

  /// [A] Existing percent icon (offers tab, coupons).
  static const Color offerIcon = Color(0xFFFF745E);

  /// [A] Percent glyph inside the coral offer icon.
  static const Color onOfferIcon = Color(0xFF172D2B);

  /// [A] Existing real-offer badge only, with ink text.
  static const Color offerBadge = Color(0xFFFF745E);

  /// [A] Free-delivery progress before eligibility (amount text is the main cue; CONFLICTS C11).
  static const Color freeDeliveryProgress = Color(0xFFFF745E);

  /// [D] Light track behind the free-delivery bar.
  static const Color freeDeliveryTrack = Color(0xFFD8E5DF);

  // ---------------------------------------------------------------- text
  /// [A] Body text, product names, titles.
  static const Color text = Color(0xFF172D2B);

  /// [A] Prices and totals. Never coral or petrol.
  static const Color price = Color(0xFF172D2B);

  /// [I] Units, descriptions, placeholders, struck-through old price.
  static const Color textSecondary = Color(0xFF5A6D68);

  /// [I] Neutral icons.
  static const Color iconNeutral = Color(0xFF5A6D68);

  // ---------------------------------------------------------------- borders
  /// [I] Decorative divider for white cards on white, only where needed (1.30:1).
  static const Color border = Color(0xFFD8E5DF);

  /// [I] Boundary that identifies a control on white: search fields on white pages, inputs (4.17:1).
  /// Do NOT add it to the home-header search on petrol (HM-09, provisional).
  /// The current quantity stepper is solid ([quantityStepper]) and has no border.
  static const Color controlBorder = Color(0xFF6B8179);

  // ---------------------------------------------------------------- semantic
  /// [I] Delete and error text/icons. Never a purchase button.
  static const Color error = Color(0xFFB42318);

  /// [I] Error/delete panel and load-failure background.
  static const Color errorSurface = Color(0xFFFFF0ED);

  /// [P] Confirm button inside the empty-cart dialog only.
  static const Color destructiveAction = Color(0xFFB42318);

  /// [P] Label on the destructive button (6.57:1).
  static const Color onDestructiveAction = Color(0xFFFFFFFF);

  /// [I] Warning text/icon: price change, stock change, unknown submit result.
  static const Color warning = Color(0xFF805500);

  /// [I] Warning panel background. Not decorative.
  static const Color warningSurface = Color(0xFFFFF4D6);

  /// [P] Server-confirmed success message only (CONFLICTS C6).
  static const Color success = Color(0xFF18794E);

  /// [P] Success panel background.
  static const Color successSurface = Color(0xFFEAF6EE);

  /// [I] Disabled button fill. An unavailable action never stays coral.
  static const Color disabled = Color(0xFFE5EBE7);

  /// [I] Disabled label (4.54:1, borderline).
  static const Color onDisabled = Color(0xFF5A6D68);

  /// [P] Scrim behind dialogs and sheets (#172D2B at 40%).
  static const Color overlay = Color(0x66172D2B);
}

/// Colour-only theme wiring.
///
/// Material mapping (decided so that default Material widgets do not turn coral
/// where Jarna wants petrol):
///   primary   = petrol  -> TextButton, Checkbox, Radio, Switch, focus, progress, links
///   secondary = coral   -> purchase actions; FilledButton/ElevatedButton are themed coral explicitly
///   primaryContainer = mint -> selection / support surfaces
abstract final class JarnaTheme {
  static const ColorScheme colorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: JarnaColors.link, // petrol
    onPrimary: JarnaColors.onBrandHeader, // white
    primaryContainer: JarnaColors.selectionSurface, // mint
    onPrimaryContainer: JarnaColors.text, // ink
    secondary: JarnaColors.primaryAction, // coral
    onSecondary: JarnaColors.onPrimaryAction, // ink
    secondaryContainer: JarnaColors.selectionSurface, // mint (M3 NavigationBar indicator)
    onSecondaryContainer: JarnaColors.text,
    tertiary: JarnaColors.offerIcon, // coral
    onTertiary: JarnaColors.onOfferIcon, // ink
    error: JarnaColors.error,
    onError: JarnaColors.onDestructiveAction,
    errorContainer: JarnaColors.errorSurface,
    onErrorContainer: JarnaColors.error,
    surface: JarnaColors.surface, // white
    onSurface: JarnaColors.text, // ink
    onSurfaceVariant: JarnaColors.textSecondary,
    // Keep every M3 surface container pure white so nothing picks up a tint.
    surfaceContainerLowest: JarnaColors.surface,
    surfaceContainerLow: JarnaColors.surface,
    surfaceContainer: JarnaColors.surface,
    surfaceContainerHigh: JarnaColors.surface,
    surfaceContainerHighest: JarnaColors.surface,
    surfaceTint: Colors.transparent,
    outline: JarnaColors.controlBorder,
    outlineVariant: JarnaColors.border,
    shadow: Color(0xFF000000),
    scrim: JarnaColors.overlay,
    inverseSurface: JarnaColors.text,
    onInverseSurface: JarnaColors.surface,
    inversePrimary: JarnaColors.selectionSurface,
  );

  /// Coral purchase button colours with ink label, pressed and disabled states.
  /// Colours only: shape, padding, size and text style come from [base].
  static ButtonStyle _primaryActionColors() => ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) return JarnaColors.disabled;
          if (states.contains(WidgetState.pressed)) return JarnaColors.primaryActionPressed;
          return JarnaColors.primaryAction;
        }),
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) return JarnaColors.onDisabled;
          return JarnaColors.onPrimaryAction;
        }),
        iconColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) return JarnaColors.onDisabled;
          return JarnaColors.onPrimaryAction;
        }),
        // Pressed colour is already in backgroundColor; no extra dimming overlay.
        overlayColor: const WidgetStatePropertyAll(Colors.transparent),
      );

  static ButtonStyle _linkColors() => ButtonStyle(
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) return JarnaColors.onDisabled;
          if (states.contains(WidgetState.pressed)) return JarnaColors.linkPressed;
          return JarnaColors.link;
        }),
      );

  /// Applies Jarna colours to the app's EXISTING theme without touching layout.
  ///
  /// Usage in MaterialApp:  theme: JarnaTheme.applyColors(existingTheme)
  static ThemeData applyColors(ThemeData base) {
    // ButtonStyle.merge: the receiver's non-null values win, so colours come
    // from Jarna and everything else (shape, padding, textStyle) from base.
    final primary = _primaryActionColors();
    final link = _linkColors();
    return base.copyWith(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: JarnaColors.background,
      canvasColor: JarnaColors.background,
      cardColor: JarnaColors.surface,
      dividerColor: JarnaColors.border,
      disabledColor: JarnaColors.onDisabled,
      appBarTheme: base.appBarTheme.copyWith(
        // Inner pages: white header + ink title. The home header sets
        // JarnaColors.brandHeader / onBrandHeader locally.
        backgroundColor: JarnaColors.surface,
        foregroundColor: JarnaColors.innerHeaderTitle,
        surfaceTintColor: Colors.transparent,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: primary.merge(base.filledButtonTheme.style),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: primary.merge(base.elevatedButtonTheme.style),
      ),
      textButtonTheme: TextButtonThemeData(
        style: link.merge(base.textButtonTheme.style),
      ),
      bottomNavigationBarTheme: base.bottomNavigationBarTheme.copyWith(
        backgroundColor: JarnaColors.footer,
        selectedItemColor: JarnaColors.tabActive,
        unselectedItemColor: JarnaColors.tabInactive,
      ),
      inputDecorationTheme: base.inputDecorationTheme.copyWith(
        fillColor: JarnaColors.surface,
        hintStyle: (base.inputDecorationTheme.hintStyle ?? const TextStyle())
            .copyWith(color: JarnaColors.textSecondary),
        // Border geometry is kept from base; only colours are replaced.
        enabledBorder: _recolor(base.inputDecorationTheme.enabledBorder, JarnaColors.controlBorder),
        focusedBorder: _recolor(base.inputDecorationTheme.focusedBorder, JarnaColors.focusBorder),
        errorBorder: _recolor(base.inputDecorationTheme.errorBorder, JarnaColors.error),
        focusedErrorBorder: _recolor(base.inputDecorationTheme.focusedErrorBorder, JarnaColors.error),
      ),
      progressIndicatorTheme: base.progressIndicatorTheme.copyWith(
        color: JarnaColors.link,
      ),
      dialogTheme: base.dialogTheme.copyWith(
        backgroundColor: JarnaColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      bottomSheetTheme: base.bottomSheetTheme.copyWith(
        backgroundColor: JarnaColors.surface,
        surfaceTintColor: Colors.transparent,
        modalBarrierColor: JarnaColors.overlay,
      ),
    );
  }

  static InputBorder? _recolor(InputBorder? border, Color color) {
    if (border == null) return null;
    return border.copyWith(borderSide: border.borderSide.copyWith(color: color));
  }
}
