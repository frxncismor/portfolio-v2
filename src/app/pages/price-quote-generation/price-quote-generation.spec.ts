import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceQuoteGeneration } from './price-quote-generation';

describe('PriceQuoteGeneration', () => {
  let component: PriceQuoteGeneration;
  let fixture: ComponentFixture<PriceQuoteGeneration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceQuoteGeneration],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceQuoteGeneration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
