const http = require('http');
const url = require('url');
const fs = require('fs');
const axios = require('axios');

const { chromium } = require('playwright');

const PORT = 5000;

const logfile = fs.createWriteStream('./log.txt', { flags: 'a' });

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
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto(`https://roadmap.sh/${roadmap}`, { waitUntil: 'networkidle' });

        const topics = await page.$$('[data-type="topic"]');
        const subtopics = await page.$$('[data-type="subtopic"]');

        logfile.write(`${new Date().toISOString()} - Scraped ${topics.length} topics and ${subtopics.length} subtopics from ${roadmap}\n`);

        const topicContents = await Promise.all(
            topics.map(async topic => {
                const title = await topic.getAttribute('data-title');
                const node = await topic.getAttribute('data-node-id');
                const url = `https://roadmap.sh/${roadmap}/${title.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').replace(/\s/g, '-')}@${node}`;
                logfile.write(`${new Date().toISOString()} - Scraping ${title} from ${url}\n`);
                return axios.get(url)
                    .then(res => {
                        logfile.write(`${new Date().toISOString()} - Scraped ${title} from ${url}\n`);
                        const content = res.data.match(/<p>(.*?)<\/p>/)[0];
                        return { title, content };
                    });
                }
            )
        );
        
        const subtopicContents = await Promise.all(
            subtopics.map(async subtopic => {
                const title = await subtopic.getAttribute('data-title');
                const node = await subtopic.getAttribute('data-node-id');
                const url = `https://roadmap.sh/${roadmap}/${title.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').replace(/\s/g, '-')}@${node}`;
                logfile.write(`${new Date().toISOString()} - Scraping ${title} from ${url}\n`);
                return axios.get(url)
                    .then(res => {
                        logfile.write(`${new Date().toISOString()} - Scraped ${title} from ${url}\n`);
                        const content = res.data.match(/<p>(.*?)<\/p>/)[0];
                        return { title, content };
                    });
                }
            )
        );

        await browser.close();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ topicContents, subtopicContents }));
        logfile.write(`${new Date().toISOString()} - Sent scraped data to client, total of ${topicContents.length} topics and ${subtopicContents.length} subtopics\n`);
    }
});

server.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}`);
});