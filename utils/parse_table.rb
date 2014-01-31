#!/usr/bin/env ruby
# -*- coding: utf-8 -*-
require 'rubygems'; require 'bundler/setup'; Bundler.require
require 'open-uri'

ROWS = 53
AVAILABLE_ATTRIBUTES=['rowspan', 'colspan', 'style', 'bgcolor', 'class', 'title', 'onclick']

# Формат: https://gist.github.com/dapi/8649553

file = ARGV[0] || raise("Укажите файл для парсинга параметром")
page = ARGV[1] || 1; page = page.to_i
row_start = (page-1) * ROWS + 1
show_header = page == 1
pretty_json = false

doc = Nokogiri::HTML( open(file), nil, 'UTF-8')

def clear_attribute key, attr
  return nil unless attr
  value = attr.value
  return nil if value.nil? || value.empty?
  return nil if value == '; color:'
  return nil if value == 'z-index:100;'
  if key=='rowspan' || key == 'colspan'
    return nil if value.to_i<=1
  elsif key==''
  end
  value
end

def parse_rows doc, path, row_num=1
  rows = {}
  first_row = row_num
  doc.xpath(path).each do |tr|
    row = { data: [] }
    tr.xpath('th|td').each do |th|
      th.content = ' ' if th.content.length==1 && th.content[0].ord == 160 # Удаляем невидимый пробел
      cell = th.content.to_s.strip.empty? ? {} : { content: th.content }

      # Добавляем номер строки чтобы была видна разница при подгрузке второй страницы
      cell[:content] << row_num if first_row>1 if cell[:content]

      AVAILABLE_ATTRIBUTES.each do |attr|
        value = clear_attribute attr, th.attribute( attr )
        cell[attr] = value if value
      end
      row[:data] << cell
    end
    rows[row_num] = row
    row_num += 1
  end

  rows
end

table = {
  data: parse_rows(doc, '//tbody/tr', row_start)
}

table['header'] = parse_rows(doc, '//thead/tr') if show_header

puts pretty_json ? JSON.pretty_generate(table) : table.to_json
