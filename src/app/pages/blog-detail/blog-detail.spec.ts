import { TestBed } from '@angular/core/testing';
import { BlogDetail } from './blog-detail';

describe('BlogDetail', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogDetail],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BlogDetail);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
