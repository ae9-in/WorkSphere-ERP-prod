import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CaretRight, House } from '@phosphor-icons/react';
import { titleCase } from '@/lib/utils';

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  if (pathnames.length === 0) return null;

  return (
    <nav className="ag-breadcrumb hidden sm:flex">
      <Link to="/dashboard" className="flex items-center gap-1">
        <House size={16} />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formattedName = titleCase(name);

        return (
          <React.Fragment key={routeTo}>
            <CaretRight size={12} className="ag-breadcrumb__separator" />
            {isLast ? (
              <span className="ag-breadcrumb__current">{formattedName}</span>
            ) : (
              <Link to={routeTo}>{formattedName}</Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
