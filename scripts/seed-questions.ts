/**
 * Seed quiz questions from .planning/contents/checkpoint-quiz.md
 * Run: npx tsx --env-file=.env.local scripts/seed-questions.ts
 *
 * Idempotent: skips questions that already exist (matched by lecture_slug + question text).
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

// Map quiz unit numbers to lecture slugs based on topic coverage
const UNIT_SLUG_MAP: Record<number, string> = {
  1: 'oauth-authn',       // AuthN vs AuthZ
  2: 'oauth-authn',       // JWT and OAuth Independence
  3: 'oauth-authn',       // MFA Layer
  4: 'security-fundamentals', // Password Hashing
  5: 'oauth-authn',       // Mobile App and client_secret / PKCE
  6: 'jwt-best-practices', // Why Refresh Tokens Exist
  7: 'jwt-best-practices', // Token Storage Comparison
  8: 'oauth-authn',       // client_id vs client_secret
  9: 'jwt-best-practices', // JWT Revocation Strategies
  10: 'oauth-authn',      // Authorization Code + PKCE Walkthrough
  11: 'service-to-service', // Auth Server /token Verification
  12: 'gaps',             // OIDC Adds What?
  13: 'gaps',             // OIDC in "Login with Google"
  14: 'gaps',             // CSRF and Bearer Headers
  15: 'gaps',             // SameSite=Strict on Refresh Cookie
  16: 'gaps',             // RBAC's Ownership Limitation
  17: 'gaps',             // Multi-Tenant SaaS Permission Model
}

interface ParsedQuestion {
  unitNumber: number
  lecture_slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  correct_idx: number
  explanation: string
  order_idx: number
}

function parseCheckpointQuiz(filePath: string): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const questions: ParsedQuestion[] = []

  // Split on quiz unit headings
  const unitBlocks = content.split(/^## Quiz Unit (\d+)/m).slice(1)

  for (let i = 0; i < unitBlocks.length; i += 2) {
    const unitNumber = parseInt(unitBlocks[i].trim(), 10)
    const block = unitBlocks[i + 1]
    if (!block) continue

    const difficultyMatch = block.match(/\*\*difficulty:\*\*\s*(easy|medium|hard)/i)
    const questionMatch = block.match(/\*\*question:\*\*\s*(.+?)(?=\n\n|\n\*\*)/s)
    const optionsMatch = block.match(/\*\*options:\*\*\s*((?:- [A-D]\).*\n?)+)/s)
    const answerMatch = block.match(/\*\*answer:\*\*\s*([A-D])\)/)
    const explanationMatch = block.match(/\*\*explanation:\*\*\s*(.+?)(?=\n\n---|\n\n##|$)/s)

    if (!difficultyMatch || !questionMatch || !optionsMatch || !answerMatch) {
      console.warn(`[Q${unitNumber}] Could not fully parse — skipping`)
      continue
    }

    const difficulty = difficultyMatch[1].toLowerCase() as 'easy' | 'medium' | 'hard'
    const question = questionMatch[1].replace(/\n/g, ' ').trim()

    const optionLines = optionsMatch[1].match(/- [A-D]\) .+/g) || []
    const options = optionLines.map((line) => line.replace(/^- [A-D]\) /, '').trim())

    const answerLetter = answerMatch[1]
    const correct_idx = 'ABCD'.indexOf(answerLetter)

    const explanation = explanationMatch
      ? explanationMatch[1].replace(/\n/g, ' ').trim()
      : ''

    const lecture_slug = UNIT_SLUG_MAP[unitNumber] ?? 'oauth-authn'

    questions.push({
      unitNumber,
      lecture_slug,
      difficulty,
      question,
      options,
      correct_idx,
      explanation,
      order_idx: unitNumber - 1,
    })
  }

  return questions
}

async function seed() {
  const filePath = path.join(process.cwd(), '.planning', 'contents', 'checkpoint-quiz.md')

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const questions = parseCheckpointQuiz(filePath)
  console.log(`Parsed ${questions.length} questions from checkpoint-quiz.md`)

  let inserted = 0
  let skipped = 0

  for (const q of questions) {
    // Check for existing question by (lecture_slug, question text)
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .eq('lecture_slug', q.lecture_slug)
      .eq('question', q.question)
      .maybeSingle()

    if (existing) {
      console.log(`[Q${q.unitNumber}] SKIP — already exists`)
      skipped++
      continue
    }

    const { error } = await supabase.from('questions').insert({
      lecture_slug: q.lecture_slug,
      question: q.question,
      options: q.options,
      correct_idx: q.correct_idx,
      explanation: q.explanation,
      difficulty: q.difficulty,
      order_idx: q.order_idx,
    })

    if (error) {
      console.error(`[Q${q.unitNumber}] INSERT FAILED:`, error.message)
    } else {
      console.log(`[Q${q.unitNumber}] INSERTED — ${q.lecture_slug} / ${q.difficulty}`)
      inserted++
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
