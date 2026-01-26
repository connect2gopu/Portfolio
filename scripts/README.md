# Resume Parser

A PDF resume parser that extracts structured data from PDF resumes, including text content and links.

## Features

- ✅ Extracts personal information (name, title, contact info)
- ✅ Extracts work experience (companies, roles, dates, descriptions)
- ✅ Extracts education (degree, institution, dates, grades)
- ✅ Extracts skills (categorized by type)
- ✅ Extracts links (email, phone, LinkedIn, GitHub, etc.)
- ✅ Outputs structured JSON data

## Usage

### Basic Usage

Parse the default resume file:

```bash
npm run parse-resume
```

This will:
- Read from: `public/resume/Resume_Gopal_7_YOE.pdf`
- Output to: `data/resume.json`

### Custom Paths

Parse a specific PDF file:

```bash
npm run parse-resume path/to/resume.pdf
```

Specify both input and output:

```bash
npm run parse-resume path/to/resume.pdf path/to/output.json
```

## Output Format

The parser generates a JSON file with the following structure:

```typescript
{
  personalInfo: {
    name: string;
    title?: string;
    summary?: string;
    contact: {
      email?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      twitter?: string;
      website?: string;
    };
  };
  workExperience: Array<{
    company: string;
    role: string;
    period: string;
    description: string;
    location?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
    grade?: string;
    location?: string;
  }>;
  skills: Array<{
    name: string;
    skills: string[];
  }>;
  links: Array<{
    text: string;
    url: string;
  }>;
  extractedAt: string; // ISO timestamp
  sourceFile: string;   // PDF filename
}
```

## How It Works

1. **PDF Parsing**: Uses `pdfjs-dist` to extract text and link annotations from the PDF
2. **Text Extraction**: Extracts all text content from all pages
3. **Link Extraction**: Extracts clickable links (email, phone, URLs) from PDF annotations
4. **Data Parsing**: Uses regex patterns and heuristics to identify and extract:
   - Personal information from header section
   - Work experience from EXPERIENCE section
   - Education from EDUCATION section
   - Skills from TECHNICAL SKILLS section
5. **Structured Output**: Generates JSON file with typed data structure

## Notes

- PDF text extraction can vary in quality depending on PDF structure
- The parser uses heuristics and may need adjustment for different resume formats
- Extracted data can be manually refined in the JSON output file
- Links are extracted from PDF annotations, which preserves clickable URLs

## Updating Your Resume

1. Replace the PDF file in `public/resume/` with your new resume
2. Run `npm run parse-resume` to regenerate the JSON data
3. The parsed data will be available in `data/resume.json`
