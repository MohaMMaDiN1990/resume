#!/usr/bin/env python3
import sys
import zipfile
import html
import re
from pathlib import Path
import xml.etree.ElementTree as ET

# Namespaces used in WordprocessingML
W_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

KNOWN_SECTION_TITLES = {
	'education',
	'industry experience',
	'work experience',
	'professional experience',
	'teaching experience',
	'publications',
	'journal publications',
	'conference publications',
	'professional membership',
	'research interests',
	'programming languages',
	'skills',
	'references',
	'hobbies',
	'summary',
	'profile',
}

DATE_RE = re.compile(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\b\d{4}\b|\b\d{4}\s*[–-]\s*(present|\d{4})", re.IGNORECASE)


def get_paragraph_style(p):
	pPr = p.find(f'{W_NS}pPr')
	if pPr is None:
		return None
	pStyle = pPr.find(f'{W_NS}pStyle')
	if pStyle is not None and 'val' in pStyle.attrib:
		return pStyle.attrib.get(f'{W_NS}val', pStyle.attrib.get('val'))
	return None


def extract_paragraph_text(p):
	parts = []
	for r in p.findall(f'.//{W_NS}t'):
		parts.append(r.text or '')
	# Preserve leading underscores markers; normalize other spaces
	text = ''.join(parts).replace('\u00A0', ' ')
	text = text.rstrip()
	return re.sub(r'\s+', ' ', text)


def is_heading_style(style_val):
	if not style_val:
		return False
	lower = style_val.lower()
	return 'heading' in lower or lower in {'title'}


# Restrictive heading detection: only heading styles or known titles

def get_heading_level(p, style_val, text):
	if is_heading_style(style_val):
		lower = style_val.lower()
		for ch in lower:
			if ch.isdigit():
				try:
					return int(ch)
				except Exception:
					return 1
		return 1
	if text and text.strip().lower() in KNOWN_SECTION_TITLES:
		return 1
	return 0


def is_list_paragraph(p):
	pPr = p.find(f'{W_NS}pPr')
	if pPr is None:
		return False
	return pPr.find(f'{W_NS}numPr') is not None


def detect_marker(text: str):
	if text.startswith('__'):
		return 'subtitle', text.lstrip('_').strip()
	if text.startswith('_'):
		return 'title', text.lstrip('_').strip()
	return None, text


def convert_docx_to_sections(docx_path: Path):
	with zipfile.ZipFile(docx_path) as z:
		xml_bytes = z.read('word/document.xml')
	root = ET.fromstring(xml_bytes)
	paragraphs = root.findall(f'.//{W_NS}p')

	sections = []
	current = None
	current_entry = None
	pending_list = None  # accumulate list items until context changes

	def flush_list_into(target_blocks):
		nonlocal pending_list
		if pending_list:
			target_blocks.append({'type': 'ul', 'items': pending_list})
		pending_list = None

	def flush_entry_into_current():
		nonlocal current_entry, current
		if current_entry and current:
			current.setdefault('blocks', []).append({'type': 'entry', 'title': current_entry['title'], 'body': current_entry['body']})
		current_entry = None

	for p in paragraphs:
		text_raw = extract_paragraph_text(p)
		if not text_raw:
			continue
		marker, text = detect_marker(text_raw)
		style = get_paragraph_style(p)
		level = get_heading_level(p, style, text)

		if marker == 'title' or (level == 1 and not current):
			# New top-level section
			flush_entry_into_current()
			if current is not None:
				flush_list_into(current.setdefault('blocks', []))
			current = {'title': text if marker == 'title' else text_raw.strip(), 'level': 1, 'blocks': []}
			sections.append(current)
			continue

		if marker == 'subtitle':
			# New entry within current section
			flush_list_into(current.setdefault('blocks', []))
			flush_entry_into_current()
			current_entry = {'title': text, 'body': []}
			continue

		# Accumulate bullets as list items to either current entry or section
		if is_list_paragraph(p):
			if pending_list is None:
				pending_list = []
			pending_list.append(text)
			continue

		# Regular paragraph: assign to current entry if exists, else to section
		if current_entry is not None:
			flush_list_into(current_entry['body'])
			current_entry['body'].append({'type': 'p', 'text': text})
			continue
		if current is None:
			# Create an implicit section if none exists yet
			current = {'title': 'Summary', 'level': 1, 'blocks': []}
			sections.append(current)
		flush_list_into(current['blocks'])
		current['blocks'].append({'type': 'p', 'text': text})

	# Final flushes
	flush_entry_into_current()
	if current is not None:
		flush_list_into(current.setdefault('blocks', []))
	return sections


def sections_to_html(sections):
	out = []
	out.append('<div id="generated-resume">')
	for sec in sections:
		title = html.escape(sec['title'])
		lvl = sec.get('level', 1)
		out.append(f'  <section class="resume-section" data-level="{lvl}">')
		out.append(f'    <h2 class="resume-title" tabindex="0">{title}</h2>')
		out.append('    <div class="resume-details">')
		for block in sec.get('blocks', []):
			if block.get('type') == 'p':
				out.append(f'      <p>{html.escape(block["text"])}</p>')
			elif block.get('type') == 'ul':
				out.append('      <ul>')
				for item in block['items']:
					out.append(f'        <li>{html.escape(item)}</li>')
				out.append('      </ul>')
			elif block.get('type') == 'entry':
				entry_title = block['title']
				meta = ''
				# Try to find a date in any body paragraph
				for b in block['body']:
					if b.get('type') == 'p':
						m = DATE_RE.search(b['text'])
						if m:
							meta = m.group(0)
							b['text'] = DATE_RE.sub('', b['text']).replace('  ', ' ').strip()
							break
				out.append('      <article class="entry">')
				out.append('        <div class="entry__header">')
				out.append(f'          <h3 class="entry__title">{html.escape(entry_title)}</h3>')
				out.append(f'          <span class="entry__meta">{html.escape(meta)}</span>')
				out.append('        </div>')
				out.append('        <div class="entry__body">')
				for b in block['body']:
					if b.get('type') == 'p':
						out.append(f'          <p>{html.escape(b["text"])}</p>')
					elif b.get('type') == 'ul':
						out.append('          <ul>')
						for item in b['items']:
							out.append(f'            <li>{html.escape(item)}</li>')
						out.append('          </ul>')
				out.append('        </div>')
				out.append('      </article>')
		out.append('    </div>')
		out.append('  </section>')
	out.append('</div>')
	return '\n'.join(out)


def main():
	repo_root = Path(__file__).resolve().parents[1]
	docx = repo_root / 'CV.docx'
	if not docx.exists():
		print('ERROR: CV.docx not found at', docx, file=sys.stderr)
		sys.exit(1)
	sections = convert_docx_to_sections(docx)
	html_out = sections_to_html(sections)
	out_file = repo_root / 'converted.html'
	out_file.write_text(html_out, encoding='utf-8')
	print('WROTE', out_file)


if __name__ == '__main__':
	main()