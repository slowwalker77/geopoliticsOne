'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import 'intersection-observer';
import getDiscussionsByBlog from '@/services/getDiscussionByBlog';
import BlogCard from './BlogCard';

export default function BlogList({ tag, sectionTitle, sectionDescription }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const lastAuthor = useRef('');
  const lastPermlink = useRef('');
  const oldPermlink = useRef('');
  const showMore = useRef(true);
  const targetRef = useRef(null);
  const blogStart = useRef(false);

  let i = 0;
  const handleIntersect = useCallback(
    ([entry]) => {
      if (entry.isIntersecting) {
        loadMoreBlogs();
      }
    },
    [blogs]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.9,
      root: null,
    });
    const target = document.querySelector('.load-more-trigger');

    if (target) {
      observer.observe(target);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect]);

  const loadMoreBlogs = async () => {
    try {
      getDiscussionsByBlog({
        tag: tag,
        start_author: lastAuthor.current,
        start_permlink: lastPermlink.current,
        limit: 5,
      }).then((result) => {
        const extendLastBlog = result[result.length - 1];
        if (result.length > 1) {
          const resultFirstBlog = result.shift();
          if (oldPermlink.current !== extendLastBlog.permlink) {
            setBlogs((prev) => [...prev, ...result]);
            const lastBlog = result[result.length - 1];
            const { author, permlink } = lastBlog;
            lastAuthor.current = author;
            lastPermlink.current = permlink;
            showMore.current = true;
            oldPermlink.current = permlink;
          } else {
            showMore.current = false;
          }
        } else {
          alert('더이상의 Blog가 없습니다.');
        }
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const initialfetchBlogs = async () => {
    try {
      blogStart.current = true;
      setLoading(true);
      getDiscussionsByBlog({
        tag: tag,
        limit: 5,
      }).then((result) => {
        setBlogs(result);
        const lastBlog = result[result.length - 1];
        const { author, permlink } = lastBlog;

        lastAuthor.current = author;
        lastPermlink.current = permlink;
      });
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
      blogStart.current = false;
    }
  };

  useEffect(() => {
    initialfetchBlogs();
  }, []);

  return (
    <section>
      <div>
        <div className='bg-white py-4 sm:py-8'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl lg:mx-0'>
              <h2 className='text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl'>
                {sectionTitle}
              </h2>
              {/* <p className='mt-2 text-lg leading-8 text-gray-600'>
                {sectionDescription}
              </p> */}
            </div>
            <div className='mx-auto mt-4 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-8 border-t border-gray-200 pt-4 sm:mt-8 sm:pt-8 lg:mx-0 lg:max-w-none lg:grid-cols-3'>
              {blogs?.map((blog) => (
                <Link
                  key={blog.post_id}
                  href={`/blogs/${blog.author}/${blog.permlink}`}
                >
                  <BlogCard blog={blog} />
                </Link>
              ))}
            </div>
          </div>
        </div>
        {loading && <p>Loading...</p>}
        {!loading && (
          <p className='load-more-trigger' ref={targetRef}>
            {blogStart.current ? null : 'continue...'}
          </p>
        )}
      </div>
    </section>
  );
}
