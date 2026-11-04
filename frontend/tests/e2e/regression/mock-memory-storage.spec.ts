import { expect, test } from "@playwright/test";
import { installMockSaveDirectory } from "../helpers/mockSaveDirectory";

test("memory save mock preserves data, seeks and zero-filled gaps", async ({ browser }) => {
  const context = await browser.newContext();
  await installMockSaveDirectory(context, { mode: "memory" });
  const page = await context.newPage();
  try {
    await page.goto("/en");
    const result = await page.evaluate(async () => {
      const directory = await (window as any).showDirectoryPicker();
      const file = await directory.getFileHandle("sample", { create: true });
      const writable = await file.createWritable();
      await writable.write(new Uint8Array([1, 2, 3]));
      await writable.seek(1);
      await writable.write(new Uint8Array([9]));
      await writable.seek(7);
      await writable.write(new Uint8Array([8]));
      await writable.close();
      const bytes = new Uint8Array(await (await file.getFile()).arrayBuffer());
      const resumed = await file.createWritable({ keepExistingData: true });
      await resumed.seek(bytes.length);
      await resumed.write(new Uint8Array([7]));
      await resumed.close();
      return Array.from(new Uint8Array(await (await file.getFile()).arrayBuffer()));
    });
    expect(result).toEqual([1, 9, 3, 0, 0, 0, 0, 8, 7]);
  } finally {
    await context.close();
  }
});
