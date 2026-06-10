/// <reference types="cypress" />

// Static page-render smoke. Does not exercise the BE — just verifies that
// each route mounts its top-level template without throwing.
//
// Prereq: dev server running (`npm run dev`).

describe('smoke', () => {
  it('renders the home page', () => {
    cy.visit('/')
    // AppNav brand text is present on every page.
    cy.contains('Guild Service').should('be.visible')
    // The HomePage <h1> headings.
    cy.get('h1').should('contain.text', 'Guild Service')
  })

  it('renders the login form', () => {
    cy.visit('/login')
    cy.contains('Sign in').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('renders the talents tab for melaniya with summary strip + 3 columns', () => {
    cy.visit('/characters/eu/the-maelstrom/melaniya/talents')
    // The card heading mounts as soon as the page renders, before BE resolves.
    cy.contains('h2', 'Talents', { timeout: 30_000 }).should('be.visible')
    // Once the tree resolves, the three column headings are present.
    cy.contains('h3', 'Class', { timeout: 30_000 }).should('be.visible')
    cy.contains('h3', /^Hero/).should('be.visible')
    cy.contains('h3', 'Spec').should('be.visible')
    // Summary strip + at least one octagonal choice frame are rendered.
    cy.get('.talent-node').should('have.length.at.least', 10)
    cy.get('.talent-node--choice').should('have.length.at.least', 1)
  })
})
