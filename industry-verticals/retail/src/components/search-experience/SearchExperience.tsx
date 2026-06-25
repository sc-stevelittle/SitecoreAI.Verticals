'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Field, Text, useSitecore } from '@sitecore-content-sdk/nextjs';
import { SearchService, SearchDocument } from '@sitecore-content-sdk/search';
import { useSearchParams } from 'next/navigation';
import { ComponentProps } from 'lib/component-props';

interface SearchExperienceFields {
  Heading?: Field<string>;
  SearchIndexId?: Field<string>;
  ResultsPerPage?: Field<string>;
  TitleField?: Field<string>;
  DescriptionField?: Field<string>;
  UrlField?: Field<string>;
  ImageField?: Field<string>;
}

interface SearchExperienceProps extends ComponentProps {
  fields: SearchExperienceFields;
}

const DEFAULT_RESULTS_PER_PAGE = 12;

const FIELD_DEFAULTS = {
  title: 'name',
  description: 'description',
  url: 'url',
  image: 'image_url',
};

/**
 * Reads a string value from a search result document using a dot-notation path.
 */
const readField = (doc: SearchDocument, path?: string): string => {
  if (!path) {
    return '';
  }

  const value = path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      doc
    );

  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
};

const SearchExperienceWrapper: React.FC<{
  className: string;
  id?: string;
  children: React.ReactNode;
}> = ({ className, id, children }) => (
  <div className={className.trim()} id={id}>
    <div className="component-content">{children}</div>
  </div>
);

export const Default: React.FC<SearchExperienceProps> = (props) => {
  const { page } = useSitecore();
  const { fields, params } = props;
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = page.mode.isEditing;

  const searchParams = useSearchParams();
  const initialKeyphrase = searchParams?.get('q') || '';

  const searchIndexId = fields?.SearchIndexId?.value?.trim();
  const resultsPerPage = Number(fields?.ResultsPerPage?.value) || DEFAULT_RESULTS_PER_PAGE;

  const fieldMap = useMemo(
    () => ({
      title: fields?.TitleField?.value?.trim() || FIELD_DEFAULTS.title,
      description: fields?.DescriptionField?.value?.trim() || FIELD_DEFAULTS.description,
      url: fields?.UrlField?.value?.trim() || FIELD_DEFAULTS.url,
      image: fields?.ImageField?.value?.trim() || FIELD_DEFAULTS.image,
    }),
    [fields]
  );

  const contextId =
    process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID || process.env.SITECORE_EDGE_CONTEXT_ID || '';

  const [inputValue, setInputValue] = useState(initialKeyphrase);
  const [keyphrase, setKeyphrase] = useState(initialKeyphrase);
  const [page_, setPage] = useState(0);
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');

  const searchService = useMemo(() => {
    if (!contextId) {
      return null;
    }
    return new SearchService({ contextId });
  }, [contextId]);

  const runSearch = useCallback(async () => {
    if (isEditing || !searchService || !searchIndexId) {
      return;
    }

    setStatus('loading');
    try {
      const response = await searchService.search({
        searchIndexId,
        keyphrase: keyphrase || undefined,
        limit: resultsPerPage,
        offset: page_ * resultsPerPage,
      });
      setResults(response.results || []);
      setTotal(response.total || 0);
      setStatus('done');
    } catch (error) {
      console.error('SearchExperience search failed', error);
      setResults([]);
      setTotal(0);
      setStatus('error');
    }
  }, [isEditing, searchService, searchIndexId, keyphrase, resultsPerPage, page_]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setKeyphrase(inputValue.trim());
  };

  const totalPages = Math.max(1, Math.ceil(total / resultsPerPage));

  if (!fields) {
    return (
      <SearchExperienceWrapper className={`component search-experience ${styles}`} id={id}>
        <span className="is-empty-hint">Search Experience</span>
      </SearchExperienceWrapper>
    );
  }

  const notConfigured = !searchIndexId || !contextId;

  return (
    <SearchExperienceWrapper className={`component search-experience ${styles}`} id={id}>
      {(fields.Heading?.value || isEditing) && (
        <Text tag="h2" className="search-experience__heading" field={fields.Heading} />
      )}

      <form className="search-experience__form" role="search" onSubmit={handleSubmit}>
        <input
          type="search"
          className="search-experience__input"
          placeholder="Search..."
          aria-label="Search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <button type="submit" className="search-experience__submit">
          Search
        </button>
      </form>

      {isEditing || notConfigured ? (
        <p className="search-experience__hint">
          {isEditing
            ? 'Search results render on the live site. Configure the Search Index ID on the datasource.'
            : 'Search is not configured. Set the Search Index ID and Edge context ID.'}
        </p>
      ) : (
        <>
          {status === 'loading' && <p className="search-experience__status">Searching…</p>}
          {status === 'error' && (
            <p className="search-experience__status">Something went wrong. Please try again.</p>
          )}
          {status === 'done' && results.length === 0 && (
            <p className="search-experience__status">
              No results found{keyphrase ? ` for “${keyphrase}”` : ''}.
            </p>
          )}

          {results.length > 0 && (
            <>
              <p className="search-experience__summary">
                {total} result{total === 1 ? '' : 's'}
              </p>
              <ul className="search-experience__results">
                {results.map((doc, index) => {
                  const title = readField(doc, fieldMap.title);
                  const description = readField(doc, fieldMap.description);
                  const url = readField(doc, fieldMap.url);
                  const image = readField(doc, fieldMap.image);
                  const key = readField(doc, 'id') || `${title}-${index}`;

                  const Card = (
                    <article className="search-experience__card">
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="search-experience__card-image" src={image} alt={title} />
                      )}
                      <div className="search-experience__card-body">
                        {title && <h3 className="search-experience__card-title">{title}</h3>}
                        {description && (
                          <p className="search-experience__card-description">{description}</p>
                        )}
                      </div>
                    </article>
                  );

                  return (
                    <li key={key} className="search-experience__result">
                      {url ? (
                        <a className="search-experience__card-link" href={url}>
                          {Card}
                        </a>
                      ) : (
                        Card
                      )}
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <nav className="search-experience__pagination" aria-label="Search results pages">
                  <button
                    type="button"
                    className="search-experience__page-btn"
                    disabled={page_ === 0}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  >
                    Previous
                  </button>
                  <span className="search-experience__page-info">
                    Page {page_ + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="search-experience__page-btn"
                    disabled={page_ + 1 >= totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </SearchExperienceWrapper>
  );
};
