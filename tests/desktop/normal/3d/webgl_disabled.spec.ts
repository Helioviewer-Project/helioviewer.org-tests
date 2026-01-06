import { test, expect, chromium } from "@playwright/test";
import { MobileView, DesktopView, HelioviewerFactory, MobileInterface } from "../../../page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  test(
    `[${view.name}] Verify error message when WebGL is disabled`,
    { tag: [view.tag] },
    async ({ browserName }, info) => {
      // Skip non-Chromium browsers (WebGL disable flags only work on Chromium/Edge)
      test.skip(
        browserName === "firefox" || browserName === "webkit",
        "WebGL disable flags only work on Chromium-based browsers"
      );

      // We can't use test.use({ launchOptions }) because it attempts to create the browser
      // before the test starts. This causes webkit/firefox to fail with "Unknown option --disable-webgl"
      // before test.skip() can execute. Instead, we manually launch the browser here.
      const browser = await chromium.launch({
        args: ['--disable-webgl', '--disable-webgl2']
      });

      // Use device configuration from the current project
      const context = await browser.newContext(info.project.use);
      const page = await context.newPage();

      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;

      try {
        // Load Helioviewer
        await hv.Load("/");
        await hv.WaitForLoadingComplete();
        await hv.CloseAllNotifications();

        // Set observation date to ensure data is available
        await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 00:00:00"));
        await hv.WaitForLoadingComplete();
        await hv.CloseAllNotifications();

        // Attempt to enable 3D mode
        await hv.Toggle3D();

        // Verify error message is displayed
        await expect(
          page.locator("div.jGrowl-notification.error > div.jGrowl-message")
            .getByText(/Your browser does not support WebGL/i)
        ).toBeVisible();

        // Verify 3D mode did not activate
        expect(await page.locator(".js-3d-toggle.active").count()).toBe(0);
      } finally {
        await context.close();
        await browser.close();
      }
    }
  );
});
