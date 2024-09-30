import { parseGroups, parseHtml } from '../services/parse.js';

const readLessons = async (url: string) => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	}

	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('text/html')) {
		const text = await response.text();
		return parseHtml(text);
	} else {
		throw new Error(`Expected HTML but received ${contentType}`);
	}
};

const readGroups = async (url: string) => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	}

	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('text/html')) {
		const text = await response.text();
		return parseGroups(text);
	} else {
		throw new Error(`Expected HTML but received ${contentType}`);
	}
};


export { readLessons, readGroups };
