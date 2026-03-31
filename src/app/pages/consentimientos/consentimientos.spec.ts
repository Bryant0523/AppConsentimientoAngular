import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Consentimientos } from './consentimientos';

describe('Consentimientos', () => {
  let component: Consentimientos;
  let fixture: ComponentFixture<Consentimientos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Consentimientos],
    }).compileComponents();

    fixture = TestBed.createComponent(Consentimientos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
