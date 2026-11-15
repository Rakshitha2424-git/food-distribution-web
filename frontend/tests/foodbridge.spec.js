
import { test, expect } from "@playwright/test";

test("FoodBridge login page should load", async ({ page }) => {
    await page.goto("http://localhost:5173/");

    await expect(
        page.getByRole("heading", { name: "FoodBridge" })
    ).toBeVisible();

    await expect(
        page.getByRole("button", { name: "Login",exact:true })
    ).toBeVisible();

    await expect(
        page.getByRole("button", { name: "Register" })
    ).toBeVisible();
});
