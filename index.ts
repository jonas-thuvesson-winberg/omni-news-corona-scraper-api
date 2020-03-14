import Axios from 'axios-observable';
import * as express from 'express';
import * as cheerio from 'cheerio';
import { AxiosResponse } from 'axios';
import * as cors from 'cors';

const app = express();

app.get('/hello', (_, res) => res.send('Hello World!'));

interface Article {
  title?: string;
  content?: { paragraphs: string[] };
}

const parseArticles = (htmlString: string): Article[] => {
  const $ = cheerio.load(htmlString);

  const articlesMarkup = $('article');
  const articles: Article[] = [];

  articlesMarkup.each((_, element) => {
    const paragraphs: any[] = [];
    $(element)
      .find('.resource--text p')
      .each((_, element) => {
        paragraphs.push(
          $(element)
            .text()
            .trim()
        );
      });

    articles.push({
      title: $(element)
        .find('.resource--title')
        .text()
        .trim(),
      content: {
        paragraphs: paragraphs
      }
    });
  });

  return articles;
};

const constructArticleMarkup = (article: Article): string => {
  const heading = `<h2 class="title">${article.title}</h2>`;
  const articlesHtml = article.content.paragraphs.map(x => `<p>${x}</p>`);
  const content = `<div class="content">${articlesHtml.join('')}</div>`;
  return `<div class="article">${heading} ${content}</div>`;
};

const constructArticlesMarkup = (articles: Article[]): string => {
  const htmlArticles = articles.map(x => constructArticleMarkup(x));
  return `<div class="articles">${htmlArticles.join('')}</div>`;
};

const corsOptions = {
  origin: '*'
};

const c = cors(corsOptions);

app.get('/content/json', c, (_, res) => {
  Axios.get(
    'https://omni.se/t/coronaviruset/3ee2d7f6-56f1-4573-82b9-a4164cbdc902'
  ).subscribe(
    (response: AxiosResponse<string>) => {
      const parsed = parseArticles(response.data);
      res.send(parsed);
    },
    error => {
      console.log('this was the error');
      console.log(error);
    }
  );
});

app.get('/content/html', c, (_, res) => {
  Axios.get(
    'https://omni.se/t/coronaviruset/3ee2d7f6-56f1-4573-82b9-a4164cbdc902'
  ).subscribe(
    (response: AxiosResponse<string>) => {
      const parsed = parseArticles(response.data);
      res.send(constructArticlesMarkup(parsed));
    },
    error => {
      console.log('this was the error');
      console.log(error);
    }
  );
});

app.listen(3000, () => console.log(`Example app listening on port 3000!`));
