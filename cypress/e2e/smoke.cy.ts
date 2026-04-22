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
})
