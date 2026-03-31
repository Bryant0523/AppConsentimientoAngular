import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicosComponent } from './medicos';

describe('MedicosComponent', () => {
  let component: MedicosComponent;
  let fixture: ComponentFixture<MedicosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
