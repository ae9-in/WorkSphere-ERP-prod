import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { titleCase } from '@/lib/utils';

const breadcrumbMap: Record<string, string[]> = {
  '/dashboard': ['Dashboard'],
  '/employees': ['Human Resources (HRMS)', 'Employee Management'],
  '/employees/create': ['Human Resources (HRMS)', 'Employee Management', 'Create'],
  '/employees/profile': ['Human Resources (HRMS)', 'Employee Management', 'Profile'],
  '/recruitment': ['Human Resources (HRMS)', 'Recruitment (ATS)'],
  '/onboarding': ['Human Resources (HRMS)', 'Onboarding'],
  '/offboarding': ['Human Resources (HRMS)', 'Offboarding'],
  '/attendance': ['Human Resources (HRMS)', 'Attendance'],
  '/leave': ['Human Resources (HRMS)', 'Leave Management'],
  '/payroll': ['Human Resources (HRMS)', 'Payroll'],
  '/performance': ['Human Resources (HRMS)', 'Performance'],
  '/lms': ['Human Resources (HRMS)', 'Learning Management (LMS)'],
  '/documents': ['Human Resources (HRMS)', 'Employee Documents'],
  '/finance/accounting': ['Finance', 'Accounting'],
  '/finance/expenses': ['Finance', 'Expenses'],
  '/finance/invoicing': ['Finance', 'Invoicing'],
  '/finance/budgeting': ['Finance', 'Budgeting'],
  '/finance/tax': ['Finance', 'Tax Management'],
  '/sales/leads': ['Sales (CRM)', 'Leads'],
  '/sales/customers': ['Sales (CRM)', 'Customers'],
  '/sales/quotations': ['Sales (CRM)', 'Quotations'],
  '/sales/orders': ['Sales (CRM)', 'Sales Orders'],
  '/sales/follow-ups': ['Sales (CRM)', 'Follow Ups'],
  '/inventory': ['Inventory', 'Inventory'],
  '/placeholder/warehouse': ['Inventory', 'Warehouse'],
  '/placeholder/purchase-orders': ['Inventory', 'Purchase Orders'],
  '/placeholder/suppliers': ['Inventory', 'Suppliers'],
  '/placeholder/stock-movement': ['Inventory', 'Stock Movement'],
  '/placeholder/projects': ['Projects', 'Projects'],
  '/placeholder/tasks': ['Projects', 'Tasks'],
  '/placeholder/timesheets': ['Projects', 'Timesheets'],
  '/placeholder/milestones': ['Projects', 'Milestones'],
  '/placeholder/workflow-automation': ['Operations', 'Workflow Automation'],
  '/placeholder/users': ['Administration', 'User Management'],
  '/placeholder/permissions': ['Administration', 'Roles & Permissions'],
  '/placeholder/company-settings': ['Administration', 'Company Settings'],
  '/placeholder/integrations': ['Administration', 'Integrations'],
  '/assets': ['Operations', 'Assets'],
  '/manufacturing': ['Operations', 'Manufacturing'],
  '/maintenance': ['Operations', 'Maintenance'],
  '/supply-chain': ['Operations', 'Supply Chain'],
  '/helpdesk': ['Operations', 'Helpdesk'],
  '/community': ['Collaboration', 'Feeds'],
  '/reports': ['Analytics', 'Reports'],
  '/analytics/dashboards': ['Analytics', 'Dashboards'],
  '/analytics/bi': ['Analytics', 'Business Intelligence'],
  '/approvals': ['Administration', 'Approvals'],
  '/notifications': ['Administration', 'Notifications'],
  '/audit': ['Administration', 'Audit Logs'],
  '/settings': ['Administration', 'Settings']
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  if (cleanPath === '/') return [];

  // 1. Direct match
  if (breadcrumbMap[cleanPath]) {
    return breadcrumbMap[cleanPath].map((label, idx) => {
      const isLast = idx === breadcrumbMap[cleanPath].length - 1;
      return {
        label,
        href: isLast ? cleanPath : ''
      };
    });
  }

  // 2. Prefix match
  const sortedKeys = Object.keys(breadcrumbMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key !== '/' && cleanPath.startsWith(key + '/')) {
      const parentCrumb = breadcrumbMap[key];
      const remainder = cleanPath.slice(key.length + 1).split('/');
      const combined = [...parentCrumb, ...remainder.map(s => titleCase(s.replace(/-/g, ' ')))];
      return combined.map((label, idx) => {
        const isLast = idx === combined.length - 1;
        return {
          label,
          href: isLast ? cleanPath : ''
        };
      });
    }
  }

  // 3. Fallback split
  const parts = cleanPath.split('/').filter(Boolean);
  return parts.map((part, idx) => {
    const routeTo = '/' + parts.slice(0, idx + 1).join('/');
    return {
      label: titleCase(part.replace(/-/g, ' ')),
      href: routeTo
    };
  });
}

export function Breadcrumbs() {
  const location = useLocation();
  const crumbs = getBreadcrumbs(location.pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav className="ag-breadcrumb hidden sm:flex items-center gap-1.5 text-xs text-ag-ink-3">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-ag-primary transition-colors">
        <Home size={14} />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight size={12} className="text-ag-border-strong flex-shrink-0" />
            {isLast || !crumb.href ? (
              <span className={isLast ? 'text-ag-primary font-bold' : 'text-ag-ink-2 font-medium'}>
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.href} className="hover:text-ag-primary transition-colors font-medium">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
