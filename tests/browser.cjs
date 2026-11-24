const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const baseUrl = process.env.ZEHNERKREIS_TEST_URL || 'http://127.0.0.1:8080/zehnerkreis/';

async function start(page) {
    await page.goto(baseUrl);
    await page.locator('#zk-name-0').fill('Alice');
    await page.locator('#zk-name-1').fill('Bob');
    await page.locator('#zk-mode-short').check();
    await page.locator('[data-action="start"]').click();
}

async function act(page, action) {
    await page.locator(`[data-action="${action}"]`).click();
}

async function numbers(page, kind) {
    return page.locator(`#zk-players .zk-${kind} b`).allTextContents();
}

test('banked and active-round scores survive a real page reload', async () => {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage();
        await start(page);
        await act(page, 'correct'); // Alice earns one point.
        await act(page, 'correct'); // Bob earns two points.
        await act(page, 'pass');    // Alice banks her point, Bob stays in.
        assert.deepEqual(await numbers(page, 'total'), ['1', '0']);
        assert.deepEqual(await numbers(page, 'pot'), ['0', '2']);
        await page.reload();
        assert.equal(await page.locator('#zk-setup').isVisible(), false, 'the saved game must reload instead of reopening setup');
        assert.deepEqual(await page.locator('#zk-players .zk-name').allTextContents(), ['Alice', 'Bob']);
        assert.deepEqual(await numbers(page, 'total'), ['1', '0']);
        assert.deepEqual(await numbers(page, 'pot'), ['0', '2']);
        assert.equal(await page.locator('#zk-round').innerText(), 'Frage 1/4 · 2/10 aufgedeckt · 2 richtig');
    } finally {
        await browser.close();
    }
});

test('a wrong answer loses the round pot without erasing previously banked points', async () => {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage();
        await start(page);
        await act(page, 'correct');
        await act(page, 'correct');
        await act(page, 'pass'); // Alice banks one point.
        await act(page, 'wrong'); // Bob loses his unbanked two points; round two starts.
        assert.deepEqual(await numbers(page, 'total'), ['1', '0']);
        await act(page, 'correct'); // Bob earns one point.
        await act(page, 'correct'); // Alice earns two round points, on top of her banked one.
        await act(page, 'wrong');   // Bob loses his round pot.
        await act(page, 'wrong');   // Alice loses only the new pot; her banked point survives.
        assert.deepEqual(await numbers(page, 'total'), ['1', '0']);
        assert.deepEqual(await numbers(page, 'pot'), ['0', '0']);
        assert.match(await page.locator('#zk-round').innerText(), /^Frage 3\/4/);
    } finally {
        await browser.close();
    }
});
