const http = require('http');
const url = require('url');
const fs = require('fs');

const { chromium } = require('playwright');

const PORT = 5000;

const server = http.createServer(async (req, res) => {
    const { pathname, query } = url.parse(req.url, true);

    if (pathname === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end();
        return;
    }
    if (pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const html = fs.readFileSync('./index.html', 'utf8');
        res.end(html);
    }
    if (pathname === '/scrape') {
        const roadmap = query.roadmap;
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto(`https://roadmap.sh/${roadmap}`, { waitUntil: 'networkidle' });

        const topics = await page.$$('[data-type="topic"]');

        let topicContents = [];

        let i = 0;
        console.log('Fetching topics...');
        for (const topic of topics) {
            const title = await topic.getAttribute('data-title');
            await topic.click();
            await page.waitForSelector('#topic-content');
            const content = await page.$eval('#topic-content p', el => el.textContent);
            topicContents.push({ title, content });
            await page.click('id=close-topic');
            console.log(`${++i}/${topics.length} (${title})`);
        }

        const subtopics = await page.$$('[data-type="subtopic"]');

        let subtopicContents = [];

        i = 0;
        console.log('Fetching subtopics...');
        for (const topic of subtopics) {
            const title = await topic.getAttribute('data-title');
            await topic.click();
            await page.waitForSelector('#topic-content');
            const content = await page.$eval('#topic-content p', el => el.textContent);
            subtopicContents.push({ title, content });
            await page.click('id=close-topic');
            console.log(`${++i}/${subtopics.length} (${title})`);
        }

        await browser.close();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ topicContents, subtopicContents }));
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});