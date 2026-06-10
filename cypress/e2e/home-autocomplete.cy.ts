/// <reference types="cypress" />

describe('Homepage autocomplete', () => {
  it('character name suggestions appear and navigate on pick', () => {
    cy.intercept('GET', '**/api/v1/characters/suggest?*', {
      statusCode: 200,
      body: {
        suggestions: [
          {
            region: 'eu',
            realm: 'the-maelstrom',
            display_realm: 'The Maelstrom',
            name: 'melaniya',
            display_name: 'Melaniya',
            class_id: 8,
            level: 80,
            faction: 'Horde',
          },
        ],
      },
    }).as('suggestChar')

    cy.visit('/')

    cy.get('input[placeholder="Character name"]').type('mela')
    cy.wait('@suggestChar')
    cy.contains('Melaniya').should('be.visible')
    cy.contains('Melaniya').click()
    cy.url().should('include', '/characters/eu/the-maelstrom/melaniya')
  })

  it('guild name suggestions appear and navigate on pick', () => {
    cy.intercept('GET', '**/api/v1/guilds/suggest?*', {
      statusCode: 200,
      body: {
        suggestions: [
          {
            region: 'eu',
            realm: 'tarren-mill',
            display_realm: 'Tarren Mill',
            name: 'echo',
            display_name: 'Echo',
            faction: 'Horde',
          },
        ],
      },
    }).as('suggestGuild')

    cy.visit('/')

    cy.get('input[placeholder="Guild name"]').type('ech')
    cy.wait('@suggestGuild')
    cy.contains('Echo').should('be.visible')
    cy.contains('Echo').click()
    cy.url().should('include', '/guilds/eu/tarren-mill/echo')
  })

  it('shows empty state when there are no matches', () => {
    cy.intercept('GET', '**/api/v1/characters/suggest?*', {
      statusCode: 200,
      body: { suggestions: [] },
    }).as('suggestEmpty')

    cy.visit('/')

    cy.get('input[placeholder="Character name"]').type('zzzzzz')
    cy.wait('@suggestEmpty')
    cy.contains('No matches').should('be.visible')
  })
})
