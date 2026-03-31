import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Enfermeros } from './enfermeros';

describe('Enfermeros', () => {
  let component: Enfermeros;
  let fixture: ComponentFixture<Enfermeros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Enfermeros],
    }).compileComponents();

    fixture = TestBed.createComponent(Enfermeros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
