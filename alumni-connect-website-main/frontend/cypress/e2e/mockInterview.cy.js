describe('Mock Interview Page', () => {
  beforeEach(() => {
    // Assuming the user is logged in or the route is accessible without strict auth for this test
    cy.visit('/mock-interview');
  });

  it('should load the configuration view', () => {
    cy.contains('AI Mock Interviews').should('be.visible');
    cy.contains('Configure Your Interview').should('be.visible');
  });

  it('should start the interview and show chat interface', () => {
    // Wait for initial render
    cy.get('button').contains('Start Interview').click();

    // Verify chat elements are present
    cy.get('input[placeholder*="Type your answer"]').should('be.visible');
    cy.get('button[title*="Listening"]').should('exist'); // Mic button
  });
});
