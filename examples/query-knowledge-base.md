# Example: Query Knowledge Base

## User prompt

`这个项目的认证流程是怎么工作的？`

## Expected output shape

- **Answer**: evidence-backed explanation sourced from wiki pages
- **Citations**: structured citation objects pointing to specific wiki pages and sections
- **Source-derived reasoning**: clearly marked as coming from the knowledge base
- **General supplement**: clearly marked when knowledge base coverage is insufficient
- **Coverage assessment**: how well the knowledge base covers this question
- **Gaps**: what the knowledge base does not cover
- **Save offer**: whether the answer should be saved as a new wiki page or section
