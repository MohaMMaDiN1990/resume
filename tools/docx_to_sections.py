#!/usr/bin/env python3
import sys
import zipfile
import html
from pathlib import Path
import xml.etree.ElementTree as ET

# Namespaces used in WordprocessingML
W_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


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
	# Replace non-breaking spaces; collapse multiple spaces
	text = ''.join(parts).replace('\u00A0', ' ').strip()
	return ' '.join(text.split())


def is_heading(style_val):
	if not style_val:
		return False
	lower = style_val.lower()
	return 'heading' in lower or lower in {'title'}

# New helpers for heading level detection

def get_run_max_font_size(p):
	max_sz = None
	for rPr in p.findall(f'.//{W_NS}rPr'):
		sz = rPr.find(f'{W_NS}sz')
		if sz is not None:
			val = sz.attrib.get(f'{W_NS}val', sz.attrib.get('val'))
			try:
				v = int(val)
				if max_sz is None or v > max_sz:
					max_sz = v
			except Exception:
				pass
	return max_sz


def get_heading_level(p, style_val):
	# Prefer explicit heading styles from Word
	if style_val:
		lower = style_val.lower()
		if 'heading' in lower:
			# Try to extract a digit: heading 1, Heading1, etc.
			for ch in lower:
				if ch.isdigit():
					try:
						return int(ch)
					except Exception:
						return 1
			return 1
		if lower in {'title'}:
			return 1
	# Fallback heuristic based on font size (half-points)
	sz = get_run_max_font_size(p)
	if sz is not None:
		# 28 = 14pt, 24 = 12pt
		if sz >= 28:
			return 1
		if sz >= 24:
			return 2
	return 0


def is_list_paragraph(p):
	pPr = p.find(f'{W_NS}pPr')
	if pPr is None:
		return False
	return pPr.find(f'{W_NS}numPr') is not None


def convert_docx_to_sections(docx_path: Path):
	with zipfile.ZipFile(docx_path) as z:
		xml_bytes = z.read('word/document.xml')
	root = ET.fromstring(xml_bytes)
	paragraphs = root.findall(f'.//{W_NS}p')

	sections = []
	current = None
	pending_list = None  # accumulate list items

	def flush_list_into_current():
		nonlocal pending_list, current
		if pending_list and current:
			current['blocks'].append({'type': 'ul', 'items': pending_list})
		pending_list = None

	for p in paragraphs:
		text = extract_paragraph_text(p)
		if not text:
			continue
		style = get_paragraph_style(p)
		level = get_heading_level(p, style)
		if level:
			flush_list_into_current()
			current = {'title': text, 'level': level, 'blocks': []}
			sections.append(current)
			continue
		if is_list_paragraph(p):
			if pending_list is None:
				pending_list = []
			pending_list.append(text)
			continue
		else:
			flush_list_into_current()
			if current is None:
				current = {'title': 'Summary', 'level': 1, 'blocks': []}
				sections.append(current)
			current['blocks'].append({'type': 'p', 'text': text})

	flush_list_into_current()
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
		for block in sec['blocks']:
			if block['type'] == 'p':
				out.append(f'      <p>{html.escape(block["text"])}</p>')
			elif block['type'] == 'ul':
				out.append('      <ul>')
				for item in block['items']:
					out.append(f'        <li>{html.escape(item)}</li>')
				out.append('      </ul>')
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