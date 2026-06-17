from flask import Flask, jsonify, render_template
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
import html
import re

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

NAMESPACES = {
    'atom': 'http://www.w3.org/2005/Atom',
    'content': 'http://purl.org/rss/1.0/modules/content/',
}


def strip_html(raw_html: str) -> str:
    """Remove HTML tags and decode entities for plain-text preview."""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def parse_feed(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)

    # Determine feed format: Atom vs RSS 2.0
    tag = root.tag
    entries = []

    if 'feed' in tag:  # Atom
        for entry in root.findall('atom:entry', NAMESPACES):
            title_el = entry.find('atom:title', NAMESPACES)
            link_el = entry.find('atom:link', NAMESPACES)
            updated_el = entry.find('atom:updated', NAMESPACES)
            summary_el = entry.find('atom:summary', NAMESPACES)
            content_el = entry.find('atom:content', NAMESPACES)

            title = title_el.text if title_el is not None else 'No Title'
            link = link_el.get('href', '#') if link_el is not None else '#'
            updated_raw = updated_el.text if updated_el is not None else ''
            raw_body = ''
            if content_el is not None and content_el.text:
                raw_body = content_el.text
            elif summary_el is not None and summary_el.text:
                raw_body = summary_el.text

            try:
                dt = datetime.fromisoformat(updated_raw.replace('Z', '+00:00'))
                updated = dt.strftime('%B %d, %Y')
            except Exception:
                updated = updated_raw

            entries.append({
                'title': title,
                'link': link,
                'date': updated,
                'body_html': raw_body,
                'preview': strip_html(raw_body)[:300],
            })

    else:  # RSS 2.0
        for item in root.findall('.//item'):
            title_el = item.find('title')
            link_el = item.find('link')
            pub_date_el = item.find('pubDate')
            desc_el = item.find('description')

            title = title_el.text if title_el is not None else 'No Title'
            link = link_el.text if link_el is not None else '#'
            pub_date_raw = pub_date_el.text if pub_date_el is not None else ''
            raw_body = desc_el.text if desc_el is not None else ''

            try:
                dt = datetime.strptime(pub_date_raw.strip(), '%a, %d %b %Y %H:%M:%S %z')
                pub_date = dt.strftime('%B %d, %Y')
            except Exception:
                pub_date = pub_date_raw

            entries.append({
                'title': title,
                'link': link,
                'date': pub_date,
                'body_html': raw_body,
                'preview': strip_html(raw_body)[:300],
            })

    return entries


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/release-notes')
def release_notes():
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'BigQuery-Release-Notes-App/1.0'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_bytes = response.read()

        entries = parse_feed(xml_bytes)
        return jsonify({'success': True, 'entries': entries, 'count': len(entries)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
